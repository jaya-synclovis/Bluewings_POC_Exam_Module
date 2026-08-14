// Generic, config-driven resolvers. Nothing in this file knows about any
// specific school, component, or subject — it only reads `type` fields off
// the config objects and dispatches accordingly.

function round2(n) {
  return Math.round(n * 100) / 100;
}

// --- Component level -------------------------------------------------------
// Adding a new formula type = add one case in resolveFormula(). Nothing else
// in the codebase needs to change.

function resolveComponentValue(componentKey, componentsByKey, marks, cache) {
  if (cache[componentKey] !== undefined) return cache[componentKey];

  const component = componentsByKey[componentKey];
  if (!component) throw new Error(`Unknown component: ${componentKey}`);

  let value;
  if (component.type === 'direct') {
    value = marks[componentKey] ?? 0;
  } else if (component.type === 'formula') {
    value = resolveFormula(component.formula, componentsByKey, marks, cache);
  } else {
    throw new Error(`Unknown component type: ${component.type}`);
  }

  cache[componentKey] = value;
  return value;
}

function resolveFormula(formula, componentsByKey, marks, cache) {
  switch (formula.type) {
    case 'percentOf': {
      const base = resolveComponentValue(formula.of, componentsByKey, marks, cache);
      return round2(base * formula.percent);
    }
    case 'sum': {
      const total = formula.of.reduce(
        (sum, key) => sum + resolveComponentValue(key, componentsByKey, marks, cache),
        0
      );
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
      const total = formula.of.reduce(
        (sum, key) => sum + resolveComponentValue(key, componentsByKey, marks, cache),
        0
      );
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
    // case 'nextFormulaType': { ... }  <-- this is where a new formula type plugs in
    default:
      throw new Error(`Unknown formula type: ${formula.type}`);
  }
}

function resolveAllComponents(components, marks) {
  const componentsByKey = Object.fromEntries(components.map((c) => [c.key, c]));
  const cache = {};
  const result = {};
  for (const c of components) {
    result[c.key] = resolveComponentValue(c.key, componentsByKey, marks, cache);
  }
  return result;
}

// --- Total level -------------------------------------------------------
// Adding a new total type = add one case in resolveTotal().

function resolveTotal(totalFormula, components, componentValues) {
  switch (totalFormula.type) {
    case 'sum': {
      return round2(components.reduce((sum, c) => sum + componentValues[c.key], 0));
    }
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
    // case 'nextTotalType': { ... }  <-- this is where a new total type plugs in
    default:
      throw new Error(`Unknown total formula type: ${totalFormula.type}`);
  }
}

// A tree node is either a group (has `children`, each with its own weight —
// its score is the weighted sum of its children's fractions) or a leaf (has
// `keys` — its score is earned/max across just those keys, same math as a
// weightedGroups group). Recursion lets groups nest arbitrarily deep.
function resolveTreeNode(node, componentsByKey, componentValues) {
  if (node.children) {
    return node.children.reduce((sum, child) => sum + resolveTreeNode(child, componentsByKey, componentValues) * child.weight, 0);
  }
  const earned = node.keys.reduce((sum, key) => sum + componentValues[key], 0);
  const maxSum = node.keys.reduce((sum, key) => sum + componentsByKey[key].max, 0);
  return maxSum > 0 ? earned / maxSum : 0;
}

// Which component keys a formula (whatever its type) directly references —
// used to decide which raw input fields are actually "in use" right now,
// e.g. so Credit Score's unused raw fields can drop out of Marks Entry the
// moment nothing references them anymore.
function formulaKeys(formula) {
  switch (formula.type) {
    case 'percentOf':
      return [formula.of];
    case 'sum':
    case 'average':
    case 'bestOfN':
      return [...formula.of];
    case 'linearCombination':
      return formula.parts.map((part) => part.of);
    default:
      return [];
  }
}

// --- Grade level -------------------------------------------------------
// Purely data-driven: highest `min` that the total clears, wins.

function resolveGrade(gradeScale, totalPercent) {
  const sorted = [...gradeScale].sort((a, b) => b.min - a.min);
  const entry = sorted.find((e) => totalPercent >= e.min);
  return entry ? entry.grade : sorted[sorted.length - 1].grade;
}

module.exports = { resolveAllComponents, resolveTotal, resolveGrade, formulaKeys };
