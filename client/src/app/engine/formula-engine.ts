// Client-side mirror of the server's formula engine, used to recompute
// Total/Grade/formula cells instantly on edit, before the PUT round-trips.
// Same generic, config-driven shape as the backend: resolvers dispatch on a
// `type` field read off the config, never on a school or component name.
import {
  ComponentConfig,
  ComponentFormula,
  GradeScaleEntry,
  TotalFormula,
  TreeNode,
} from '../models/report-card.models';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// --- Component level ---------------------------------------------------
// Adding a new formula type = add one case in resolveFormula().

function resolveComponentValue(
  componentKey: string,
  componentsByKey: Record<string, ComponentConfig>,
  marks: Record<string, number>,
  cache: Record<string, number>
): number {
  if (cache[componentKey] !== undefined) return cache[componentKey];

  const component = componentsByKey[componentKey];
  if (!component) throw new Error(`Unknown component: ${componentKey}`);

  let value: number;
  if (component.type === 'direct') {
    value = marks[componentKey] ?? 0;
  } else {
    value = resolveFormula(component.formula!, componentsByKey, marks, cache);
  }

  cache[componentKey] = value;
  return value;
}

function resolveFormula(
  formula: ComponentFormula,
  componentsByKey: Record<string, ComponentConfig>,
  marks: Record<string, number>,
  cache: Record<string, number>
): number {
  switch (formula.type) {
    case 'percentOf': {
      const base = resolveComponentValue(formula.of, componentsByKey, marks, cache);
      return round2(base * formula.percent);
    }
    case 'sum': {
      const total = formula.of.reduce((sum, key) => sum + resolveComponentValue(key, componentsByKey, marks, cache), 0);
      return round2(total);
    }
    case 'linearCombination': {
      const total = formula.parts.reduce(
        (sum, part) => sum + resolveComponentValue(part.of, componentsByKey, marks, cache) * part.weight,
        0
      );
      return round2(total);
    }
    case 'average': {
      const total = formula.of.reduce((sum, key) => sum + resolveComponentValue(key, componentsByKey, marks, cache), 0);
      return round2(formula.of.length ? total / formula.of.length : 0);
    }
    case 'bestOfN': {
      const scored = formula.of.map((key) => {
        const raw = resolveComponentValue(key, componentsByKey, marks, cache);
        if (!formula.normalize) return raw;
        const max = componentsByKey[key].max;
        return max > 0 ? (raw / max) * 100 : 0;
      });
      scored.sort((a, b) => b - a);
      const top = scored.slice(0, formula.n);
      const avg = top.length ? top.reduce((sum, v) => sum + v, 0) / top.length : 0;
      return round2(avg);
    }
    // case 'nextFormulaType': { ... }  <-- new formula type plugs in here
    default:
      throw new Error(`Unknown formula type: ${(formula as ComponentFormula).type}`);
  }
}

// `fallback` covers formula components whose dependencies aren't in `marks`
// at all — e.g. Credit Score depends on Attendance, a hidden field the
// backend never sends to the client. Rather than throwing and losing the
// whole recompute, that one component keeps its last known value; the
// server's response (which DOES have full data) reconciles it a moment later.
export function resolveAllComponents(
  components: ComponentConfig[],
  marks: Record<string, number>,
  fallback: Record<string, number> = {}
): Record<string, number> {
  const componentsByKey = Object.fromEntries(components.map((c) => [c.key, c]));
  const cache: Record<string, number> = {};
  const result: Record<string, number> = {};
  for (const c of components) {
    try {
      result[c.key] = resolveComponentValue(c.key, componentsByKey, marks, cache);
    } catch {
      result[c.key] = fallback[c.key] ?? 0;
    }
  }
  return result;
}

// --- Total level ---------------------------------------------------
// Adding a new total type = add one case in resolveTotal().

export function resolveTotal(
  totalFormula: TotalFormula,
  components: ComponentConfig[],
  componentValues: Record<string, number>
): number {
  switch (totalFormula.type) {
    case 'sum':
      return round2(components.reduce((sum, c) => sum + componentValues[c.key], 0));
    case 'weightedGroups': {
      const componentsByKey = Object.fromEntries(components.map((c) => [c.key, c]));
      let total = 0;
      for (const group of totalFormula.groups) {
        const earned = group.keys.reduce((sum, key) => sum + componentValues[key], 0);
        const maxSum = group.keys.reduce((sum, key) => sum + componentsByKey[key].max, 0);
        const fraction = maxSum > 0 ? earned / maxSum : 0;
        total += fraction * group.weight * 100;
      }
      return round2(total);
    }
    case 'weightedTree': {
      const componentsByKey = Object.fromEntries(components.map((c) => [c.key, c]));
      const fraction = resolveTreeNode(totalFormula.root, componentsByKey, componentValues);
      return round2(fraction * 100);
    }
    // case 'nextTotalType': { ... }  <-- new total type plugs in here
    default:
      throw new Error(`Unknown total formula type: ${(totalFormula as TotalFormula).type}`);
  }
}

// A group node's score is the weighted sum of its children's fractions; a
// leaf node's score is earned/max across just its own keys. Recursion lets
// groups nest arbitrarily deep.
function resolveTreeNode(
  node: TreeNode,
  componentsByKey: Record<string, ComponentConfig>,
  componentValues: Record<string, number>
): number {
  if ('children' in node) {
    return node.children.reduce((sum, child) => sum + resolveTreeNode(child, componentsByKey, componentValues) * child.weight, 0);
  }
  const earned = node.keys.reduce((sum, key) => sum + componentValues[key], 0);
  const maxSum = node.keys.reduce((sum, key) => sum + componentsByKey[key].max, 0);
  return maxSum > 0 ? earned / maxSum : 0;
}

// --- Grade level ---------------------------------------------------
// Purely data-driven: highest `min` that the total clears, wins.

export function resolveGrade(gradeScale: GradeScaleEntry[], totalPercent: number): string {
  const sorted = [...gradeScale].sort((a, b) => b.min - a.min);
  const entry = sorted.find((e) => totalPercent >= e.min);
  return entry ? entry.grade : sorted[sorted.length - 1].grade;
}
