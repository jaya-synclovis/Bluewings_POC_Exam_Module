const express = require('express');
const students = require('../db/students');
const studentMarks = require('../db/studentMarks');
const assessmentComponents = require('../db/assessmentComponents');
const gradeOverrides = require('../db/gradeOverrides');
const { getSchool, resolveScheme, findComponentByCode } = require('../services/schemeResolver');
const { resolveAllComponents, resolveTotal, resolveGrade } = require('../engine/formulaEngine');

const router = express.Router();

function marksForStudentSubjectScheme(studentId, subjectId, schemeId) {
  const marks = {};
  studentMarks
    .filter((m) => m.studentId === studentId && m.subjectId === subjectId && m.schemeId === schemeId)
    .forEach((m) => {
      const component = assessmentComponents.find((c) => c.id === m.componentId);
      marks[component.code] = m.marksObtained;
    });
  return marks;
}

// A manual override always wins over the auto-computed grade — it's a
// separate, sparse table, so most students simply have no row here.
function resolveGradeWithOverride(studentId, subjectId, schemeId, gradeScale, total) {
  const override = gradeOverrides.find(
    (g) => g.studentId === studentId && g.subjectId === subjectId && g.schemeId === schemeId
  );
  if (override) return { grade: override.grade, gradeOverridden: true };
  return { grade: resolveGrade(gradeScale, total), gradeOverridden: false };
}

function buildStudentView(student, className, subjectName, resolved) {
  // Resolve against ALL linked components (so a formula like Credit Score
  // can reach its hidden Attendance/Discipline inputs), but only ever send
  // the client the subset that's actually visible — hidden fields never
  // leave the server, in `marks` or in `computed.components`.
  const marks = marksForStudentSubjectScheme(student.id, resolved.subjectRow.id, resolved.scheme.id);
  const allValues = resolveAllComponents(resolved.allComponents, marks);
  const total = resolveTotal(resolved.totalFormula, resolved.components, allValues);
  const { grade, gradeOverridden } = resolveGradeWithOverride(
    student.id,
    resolved.subjectRow.id,
    resolved.scheme.id,
    resolved.gradeScale,
    total
  );

  const visibleKeys = new Set(resolved.components.map((c) => c.key));
  const visibleMarks = Object.fromEntries(Object.entries(marks).filter(([key]) => visibleKeys.has(key)));
  const visibleValues = Object.fromEntries(Object.entries(allValues).filter(([key]) => visibleKeys.has(key)));

  return {
    id: student.id,
    schoolId: student.schoolId,
    class: className,
    subject: subjectName,
    term: resolved.scheme.term,
    name: student.name,
    marks: visibleMarks,
    computed: { components: visibleValues, total, grade, gradeOverridden },
  };
}

// GET /api/schools/:schoolId/students?class=&subject=&term=
router.get('/schools/:schoolId/students', (req, res) => {
  const schoolId = Number(req.params.schoolId);
  if (!getSchool(schoolId)) return res.status(404).json({ error: 'School not found' });

  const { class: className, subject: subjectName, term } = req.query;
  const resolved = resolveScheme(schoolId, className, subjectName, term);
  if (!resolved) return res.status(404).json({ error: 'No scheme configured for this class/subject/term' });

  const roster = students.filter((s) => s.schoolId === schoolId && s.classId === resolved.classRow.id);
  res.json(roster.map((s) => buildStudentView(s, className, subjectName, resolved)));
});

// PUT /api/schools/:schoolId/students/:studentId  { class, subject, term, componentKey, value }
router.put('/schools/:schoolId/students/:studentId', (req, res) => {
  const schoolId = Number(req.params.schoolId);
  if (!getSchool(schoolId)) return res.status(404).json({ error: 'School not found' });

  const studentId = Number(req.params.studentId);
  const student = students.find((s) => s.id === studentId && s.schoolId === schoolId);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const { class: className, subject: subjectName, term, componentKey, value } = req.body;
  const resolved = resolveScheme(schoolId, className, subjectName, term);
  if (!resolved) return res.status(404).json({ error: 'No scheme configured for this class/subject/term' });

  const component = findComponentByCode(schoolId, componentKey);
  if (!component) return res.status(400).json({ error: `Unknown component: ${componentKey}` });
  if (component.entryType !== 'direct') {
    return res.status(400).json({ error: `Component ${componentKey} is calculated and cannot be edited directly` });
  }

  const numericValue = Number(value);
  if (Number.isNaN(numericValue) || numericValue < 0 || numericValue > component.maxMarks) {
    return res.status(400).json({ error: `${componentKey} must be a number between 0 and ${component.maxMarks}` });
  }

  const existing = studentMarks.find(
    (m) =>
      m.studentId === studentId &&
      m.subjectId === resolved.subjectRow.id &&
      m.schemeId === resolved.scheme.id &&
      m.componentId === component.id
  );
  if (existing) {
    existing.marksObtained = numericValue;
  } else {
    const nextId = studentMarks.reduce((max, m) => Math.max(max, m.id), 0) + 1;
    studentMarks.push({
      id: nextId,
      studentId,
      subjectId: resolved.subjectRow.id,
      schemeId: resolved.scheme.id,
      componentId: component.id,
      marksObtained: numericValue,
    });
  }

  res.json(buildStudentView(student, className, subjectName, resolved));
});

// PUT /api/schools/:schoolId/students/:studentId/grade  { class, subject, term, grade }
// Lets a teacher override the auto-computed grade. The override is stored
// separately from marks — editing marks later does NOT clear it; the
// teacher must explicitly pick a new grade to change it again.
router.put('/schools/:schoolId/students/:studentId/grade', (req, res) => {
  const schoolId = Number(req.params.schoolId);
  if (!getSchool(schoolId)) return res.status(404).json({ error: 'School not found' });

  const studentId = Number(req.params.studentId);
  const student = students.find((s) => s.id === studentId && s.schoolId === schoolId);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const { class: className, subject: subjectName, term, grade } = req.body;
  const resolved = resolveScheme(schoolId, className, subjectName, term);
  if (!resolved) return res.status(404).json({ error: 'No scheme configured for this class/subject/term' });

  const validGrades = resolved.gradeScale.map((g) => g.grade);
  if (!validGrades.includes(grade)) {
    return res.status(400).json({ error: `Grade must be one of: ${validGrades.join(', ')}` });
  }

  const existing = gradeOverrides.find(
    (g) => g.studentId === studentId && g.subjectId === resolved.subjectRow.id && g.schemeId === resolved.scheme.id
  );
  if (existing) {
    existing.grade = grade;
  } else {
    const nextId = gradeOverrides.reduce((max, g) => Math.max(max, g.id), 0) + 1;
    gradeOverrides.push({
      id: nextId,
      studentId,
      subjectId: resolved.subjectRow.id,
      schemeId: resolved.scheme.id,
      grade,
    });
  }

  res.json(buildStudentView(student, className, subjectName, resolved));
});

module.exports = router;
