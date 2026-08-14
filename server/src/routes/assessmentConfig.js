// Config screens for the two fields whose formula is meant to be
// admin-adjustable independent of the total-formula tree: Half Yearly and
// Credit Score. Both are configured per (class, subject) — Class 6 Maths and
// Class 7 Maths resolve to entirely independent components, so editing one
// never touches the other, even though both display under the same label.
const express = require('express');
const assessmentComponents = require('../db/assessmentComponents');
const schemeComponents = require('../db/schemeComponents');
const students = require('../db/students');
const studentMarks = require('../db/studentMarks');
const classSubjectSchemeMap = require('../db/classSubjectSchemeMap');
const {
  getSchool,
  getSchoolSubjects,
  resolveScheme,
  getSchemeIdForClassSubject,
  getComponentByRoleForClassSubject,
  getRawFieldsForSubject,
  getCreditScoreClassSubjectPairs,
} = require('../services/schemeResolver');

const router = express.Router();

function componentView(component) {
  return {
    key: component.code,
    label: component.name,
    max: component.maxMarks,
    formula: component.formulaConfig,
  };
}

function rawFieldView(field) {
  return {
    key: field.code,
    label: field.name,
    max: field.maxMarks,
    scope: field.scope,
    subjectName: field.subjectName ?? null,
    source: field.source,
  };
}

// A 'bluewings' field simulates an auto-fetched external system: rather than
// starting blank, its mark is pre-filled with a random value the teacher can
// still edit like any other mark. Only fills in marks that don't exist yet
// or are unset — never overwrites a real value someone already entered.
function seedBluewingsMarks(schoolId, component, schemeIds) {
  schemeIds.forEach((schemeId) => {
    classSubjectSchemeMap
      .filter((m) => m.schemeId === schemeId)
      .forEach((mapping) => {
        students
          .filter((s) => s.schoolId === schoolId && s.classId === mapping.classId)
          .forEach((student) => {
            const existing = studentMarks.find(
              (m) =>
                m.studentId === student.id &&
                m.subjectId === mapping.subjectId &&
                m.schemeId === schemeId &&
                m.componentId === component.id
            );
            const randomValue = Math.round(Math.random() * component.maxMarks * 10) / 10;
            if (existing) {
              if (existing.marksObtained === undefined || existing.marksObtained === null) {
                existing.marksObtained = randomValue;
              }
              return;
            }
            const nextId = studentMarks.reduce((max, m) => Math.max(max, m.id), 0) + 1;
            studentMarks.push({
              id: nextId,
              studentId: student.id,
              subjectId: mapping.subjectId,
              schemeId,
              componentId: component.id,
              marksObtained: randomValue,
            });
          });
      });
  });
}

// Which schemes a raw field's scope reaches — a global field goes into every
// (class, subject) pair that has a Credit Score field; a subject-scoped
// field goes into every class of that one subject.
function schemeIdsForFieldScope(schoolId, scope, subjectName) {
  const pairs = getCreditScoreClassSubjectPairs(schoolId).filter(
    (p) => scope === 'global' || p.subjectName === subjectName
  );
  return [...new Set(pairs.map((p) => getSchemeIdForClassSubject(schoolId, p.className, p.subjectName)).filter(Boolean))];
}

// The visible direct components for one specific (class, subject) — used to
// populate "which fields can feed Half Yearly" checkboxes for that class.
function visibleDirectComponents(schoolId, className, subjectName) {
  const resolved = resolveScheme(schoolId, className, subjectName, null);
  if (!resolved) return [];
  return resolved.components.filter((c) => c.type === 'direct');
}

// GET /api/schools/:schoolId/half-yearly?class=&subject=
router.get('/:schoolId/half-yearly', (req, res) => {
  const schoolId = Number(req.params.schoolId);
  if (!getSchool(schoolId)) return res.status(404).json({ error: 'School not found' });

  const { class: className, subject: subjectName } = req.query;
  const component = getComponentByRoleForClassSubject(schoolId, className, subjectName, 'halfYearly');
  if (!component) {
    return res.status(404).json({ error: `No Half Yearly field for ${className} ${subjectName}` });
  }

  res.json({
    component: componentView(component),
    availableComponents: visibleDirectComponents(schoolId, className, subjectName),
  });
});

function validateHalfYearlyFormula(formula, availableKeys) {
  if (formula.type === 'linearCombination') {
    if (!Array.isArray(formula.parts) || formula.parts.length === 0) throw new Error('Select at least one component');
    formula.parts.forEach((part) => {
      if (!availableKeys.includes(part.of)) throw new Error(`Unknown component: ${part.of}`);
      if (typeof part.weight !== 'number') throw new Error('Each part needs a numeric weight');
    });
    return;
  }
  if (formula.type === 'average' || formula.type === 'sum') {
    if (!Array.isArray(formula.of) || formula.of.length === 0) throw new Error('Select at least one component');
    formula.of.forEach((key) => {
      if (!availableKeys.includes(key)) throw new Error(`Unknown component: ${key}`);
    });
    return;
  }
  if (formula.type === 'bestOfN') {
    if (!Array.isArray(formula.of) || formula.of.length === 0) throw new Error('Select at least one component');
    formula.of.forEach((key) => {
      if (!availableKeys.includes(key)) throw new Error(`Unknown component: ${key}`);
    });
    if (!Number.isInteger(formula.n) || formula.n < 1) throw new Error('n must be a positive integer');
    if (formula.n > formula.of.length) throw new Error('n cannot exceed the number of selected components');
    return;
  }
  throw new Error(
    `Half Yearly formula must be 'linearCombination', 'average', 'sum' or 'bestOfN', got '${formula.type}'`
  );
}

// PUT /api/schools/:schoolId/half-yearly?class=&subject=  { formula }
router.put('/:schoolId/half-yearly', (req, res) => {
  const schoolId = Number(req.params.schoolId);
  if (!getSchool(schoolId)) return res.status(404).json({ error: 'School not found' });

  const { class: className, subject: subjectName } = req.query;
  const component = getComponentByRoleForClassSubject(schoolId, className, subjectName, 'halfYearly');
  if (!component) {
    return res.status(404).json({ error: `No Half Yearly field for ${className} ${subjectName}` });
  }

  const { formula } = req.body;
  if (!formula) return res.status(400).json({ error: 'formula is required' });

  const availableKeys = visibleDirectComponents(schoolId, className, subjectName).map((c) => c.key);
  try {
    validateHalfYearlyFormula(formula, availableKeys);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  component.formulaConfig = formula;
  res.json({
    component: componentView(component),
    availableComponents: visibleDirectComponents(schoolId, className, subjectName),
  });
});

// GET /api/schools/:schoolId/credit-score?class=
router.get('/:schoolId/credit-score', (req, res) => {
  const schoolId = Number(req.params.schoolId);
  if (!getSchool(schoolId)) return res.status(404).json({ error: 'School not found' });

  const { class: className } = req.query;
  const subjectsForSchool = getSchoolSubjects(schoolId).map((s) => s.name);
  const bySubject = subjectsForSchool
    .map((subjectName) => {
      const component = getComponentByRoleForClassSubject(schoolId, className, subjectName, 'creditScore');
      if (!component) return null;
      return {
        subject: subjectName,
        component: componentView(component),
        availableFields: getRawFieldsForSubject(schoolId, subjectName).map(rawFieldView),
      };
    })
    .filter(Boolean);

  res.json(bySubject);
});

function validateCreditScoreFormula(formula, availableKeys) {
  if (formula.type === 'sum') {
    if (!Array.isArray(formula.of) || formula.of.length === 0) throw new Error('Select at least one field');
    formula.of.forEach((key) => {
      if (!availableKeys.includes(key)) throw new Error(`Unknown field: ${key}`);
    });
    return;
  }
  if (formula.type === 'percentOf') {
    if (!availableKeys.includes(formula.of)) throw new Error(`Unknown field: ${formula.of}`);
    if (typeof formula.percent !== 'number') throw new Error('percent must be a number');
    return;
  }
  if (formula.type === 'linearCombination') {
    if (!Array.isArray(formula.parts) || formula.parts.length === 0) throw new Error('Select at least one field');
    formula.parts.forEach((part) => {
      if (!availableKeys.includes(part.of)) throw new Error(`Unknown field: ${part.of}`);
      if (typeof part.weight !== 'number') throw new Error('Each part needs a numeric weight');
    });
    return;
  }
  throw new Error(`Credit Score formula must be 'sum', 'percentOf' or 'linearCombination', got '${formula.type}'`);
}

// PUT /api/schools/:schoolId/credit-score/:subject?class=  { formula }
router.put('/:schoolId/credit-score/:subject', (req, res) => {
  const schoolId = Number(req.params.schoolId);
  if (!getSchool(schoolId)) return res.status(404).json({ error: 'School not found' });

  const subjectName = req.params.subject;
  const { class: className } = req.query;
  const component = getComponentByRoleForClassSubject(schoolId, className, subjectName, 'creditScore');
  if (!component) {
    return res.status(404).json({ error: `No Credit Score field for ${className} ${subjectName}` });
  }

  const { formula } = req.body;
  if (!formula) return res.status(400).json({ error: 'formula is required' });

  const availableKeys = getRawFieldsForSubject(schoolId, subjectName).map((f) => f.code);
  try {
    validateCreditScoreFormula(formula, availableKeys);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  component.formulaConfig = formula;
  res.json({
    subject: subjectName,
    component: componentView(component),
    availableFields: getRawFieldsForSubject(schoolId, subjectName).map(rawFieldView),
  });
});

// POST /api/schools/:schoolId/raw-fields  { name, maxMarks, scope, subjectName?, source }
// Admin-created input field for Credit Score — e.g. "Cleanliness". Becomes an
// ordinary editable Marks Entry column (never shown in the Report Card) the
// moment it's created, available to every class's Credit Score formula.
router.post('/:schoolId/raw-fields', (req, res) => {
  const schoolId = Number(req.params.schoolId);
  if (!getSchool(schoolId)) return res.status(404).json({ error: 'School not found' });

  const { name, maxMarks, scope, subjectName, source } = req.body;
  if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'name is required' });
  if (typeof maxMarks !== 'number' || maxMarks <= 0) return res.status(400).json({ error: 'maxMarks must be a positive number' });
  if (scope !== 'global' && scope !== 'subject') return res.status(400).json({ error: "scope must be 'global' or 'subject'" });
  if (scope === 'subject' && !getSchoolSubjects(schoolId).some((s) => s.name === subjectName)) {
    return res.status(400).json({ error: `Unknown subject: ${subjectName}` });
  }
  if (source !== 'manual' && source !== 'bluewings') {
    return res.status(400).json({ error: "source must be 'manual' or 'bluewings'" });
  }

  const code = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (!code) return res.status(400).json({ error: 'name must contain at least one letter or number' });
  if (assessmentComponents.some((c) => c.schoolId === schoolId && c.code === code)) {
    return res.status(400).json({ error: `A field named '${name}' already exists` });
  }

  const nextId = assessmentComponents.reduce((max, c) => Math.max(max, c.id), 0) + 1;
  const newComponent = {
    id: nextId,
    schoolId,
    code,
    name: name.trim(),
    maxMarks,
    entryType: 'direct',
    formulaConfig: null,
    role: 'creditScoreField',
    scope,
    subjectName: scope === 'subject' ? subjectName : undefined,
    source,
  };
  assessmentComponents.push(newComponent);

  const schemeIds = schemeIdsForFieldScope(schoolId, scope, subjectName);
  schemeIds.forEach((schemeId) => {
    const maxOrder = schemeComponents
      .filter((l) => l.schemeId === schemeId)
      .reduce((max, l) => Math.max(max, l.displayOrder), 0);
    schemeComponents.push({ schemeId, componentId: nextId, displayOrder: maxOrder + 1, isVisible: true, showInReportCard: false });
  });

  if (source === 'bluewings') seedBluewingsMarks(schoolId, newComponent, schemeIds);

  res.status(201).json(rawFieldView(newComponent));
});

// PUT /api/schools/:schoolId/raw-fields/:code  { source }
// Toggling to 'bluewings' backfills any missing per-student marks with a
// simulated auto-fetched value; toggling to 'manual' leaves existing marks
// exactly as they are — either way they stay ordinary editable marks.
router.put('/:schoolId/raw-fields/:code', (req, res) => {
  const schoolId = Number(req.params.schoolId);
  if (!getSchool(schoolId)) return res.status(404).json({ error: 'School not found' });

  const field = assessmentComponents.find(
    (c) => c.schoolId === schoolId && c.code === req.params.code && c.role === 'creditScoreField'
  );
  if (!field) return res.status(404).json({ error: 'Field not found' });

  const { source } = req.body;
  if (source && source !== 'manual' && source !== 'bluewings') {
    return res.status(400).json({ error: "source must be 'manual' or 'bluewings'" });
  }
  const switchedToBluewings = source === 'bluewings' && field.source !== 'bluewings';
  if (source) field.source = source;

  if (switchedToBluewings) {
    const schemeIds = schemeIdsForFieldScope(schoolId, field.scope, field.subjectName);
    seedBluewingsMarks(schoolId, field, schemeIds);
  }

  res.json(rawFieldView(field));
});

module.exports = router;
