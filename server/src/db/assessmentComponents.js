// The vocabulary of possible mark-entry fields, one row per school.
// `formulaConfig` is only set when `entryType` is 'formula'.
//
// `role` tags a handful of components that other config screens need to find
// generically (e.g. "which component IS this subject's Credit Score field")
// without hardcoding a component code anywhere outside this file.
//
// `source`/`scope`/`subjectName` only apply to raw fields that feed Credit
// Score (role: 'creditScoreField'). Both sources store a per-student mark
// like any other direct field and are equally teacher-editable in Marks
// Entry — the only difference is how that mark first gets filled in:
//   - source 'manual'    -> starts blank; the teacher types it in.
//   - source 'bluewings' -> starts pre-filled with a value simulating an
//     auto-fetched external system (see studentMarks.js) — still just an
//     editable mark the teacher can override.
//   - scope 'global'     -> one shared field, usable by any subject's formula.
//   - scope 'subject'    -> only usable by the one named subject's formula.
const assessmentComponents = [
  // Greenwood High
  { id: 1, schoolId: 1, code: 'PT', name: 'PT', maxMarks: 10, entryType: 'direct', formulaConfig: null },
  { id: 2, schoolId: 1, code: 'MA', name: 'MA', maxMarks: 5, entryType: 'direct', formulaConfig: null },
  { id: 3, schoolId: 1, code: 'NBS_ATT', name: 'NBS+ATT', maxMarks: 5, entryType: 'direct', formulaConfig: null },
  { id: 4, schoolId: 1, code: 'SEA', name: 'SEA', maxMarks: 10, entryType: 'direct', formulaConfig: null },
  { id: 5, schoolId: 1, code: 'TE', name: 'TE', maxMarks: 70, entryType: 'direct', formulaConfig: null },
  // Half Yearly: one component per (class, subject) — same display name
  // everywhere, but each is independently configurable (Class 6 Maths can
  // use a different formula than Class 7 Maths, or from Class 6/7 Science).
  {
    id: 15,
    schoolId: 1,
    code: 'HY_C6_MATHS',
    name: 'First Half',
    maxMarks: 70,
    entryType: 'formula',
    formulaConfig: { type: 'sum', of: ['TE'] },
    role: 'halfYearly',
  },
  {
    id: 19,
    schoolId: 1,
    code: 'HY_C6_SCI',
    name: 'First Half',
    maxMarks: 70,
    entryType: 'formula',
    formulaConfig: { type: 'sum', of: ['TE'] },
    role: 'halfYearly',
  },
  {
    id: 20,
    schoolId: 1,
    code: 'HY_C7_MATHS',
    name: 'First Half',
    maxMarks: 70,
    entryType: 'formula',
    formulaConfig: { type: 'sum', of: ['TE'] },
    role: 'halfYearly',
  },
  {
    id: 21,
    schoolId: 1,
    code: 'HY_C7_SCI',
    name: 'First Half',
    maxMarks: 70,
    entryType: 'formula',
    formulaConfig: { type: 'sum', of: ['TE'] },
    role: 'halfYearly',
  },

  // Raw inputs that feed Credit Score — editable in Marks Entry (see
  // schemeComponents.js: isVisible: true) but excluded from the Report Card
  // (showInReportCard: false); only the derived Credit Score is visible there.
  {
    id: 11,
    schoolId: 1,
    code: 'ATT',
    name: 'Total Attendance',
    maxMarks: 10,
    entryType: 'direct',
    formulaConfig: null,
    role: 'creditScoreField',
    scope: 'global',
    source: 'manual',
  },
  {
    id: 12,
    schoolId: 1,
    code: 'DISC',
    name: 'Discipline',
    maxMarks: 10,
    entryType: 'direct',
    formulaConfig: null,
    role: 'creditScoreField',
    scope: 'global',
    source: 'manual',
  },
  {
    id: 16,
    schoolId: 1,
    code: 'CERT',
    name: 'Certification',
    maxMarks: 10,
    entryType: 'direct',
    formulaConfig: null,
    role: 'creditScoreField',
    scope: 'global',
    source: 'manual',
  },
  {
    id: 17,
    schoolId: 1,
    code: 'ATT_SCI',
    name: 'Attendance (Science)',
    maxMarks: 10,
    entryType: 'direct',
    formulaConfig: null,
    role: 'creditScoreField',
    scope: 'subject',
    subjectName: 'Science',
    source: 'bluewings',
  },
  {
    id: 18,
    schoolId: 1,
    code: 'HW',
    name: 'Homework Completion',
    maxMarks: 10,
    entryType: 'direct',
    formulaConfig: null,
    role: 'creditScoreField',
    scope: 'global',
    source: 'bluewings',
  },

  // Credit Score: same display name, but a DIFFERENT component (different
  // code, different formula, different input fields) per (class, subject) —
  // proving the formula AND its inputs can vary by subject AND by class.
  {
    id: 13,
    schoolId: 1,
    code: 'CREDIT_MATHS',
    name: 'Credit Score',
    maxMarks: 20,
    entryType: 'formula',
    formulaConfig: { type: 'sum', of: ['ATT', 'CERT'] },
    role: 'creditScore',
  },
  {
    id: 14,
    schoolId: 1,
    code: 'CREDIT_SCI',
    name: 'Credit Score',
    maxMarks: 20,
    entryType: 'formula',
    formulaConfig: { type: 'sum', of: ['ATT_SCI', 'DISC'] },
    role: 'creditScore',
  },
  {
    id: 22,
    schoolId: 1,
    code: 'CREDIT_C7_MATHS',
    name: 'Credit Score',
    maxMarks: 20,
    entryType: 'formula',
    formulaConfig: { type: 'sum', of: ['ATT', 'CERT'] },
    role: 'creditScore',
  },
  {
    id: 23,
    schoolId: 1,
    code: 'CREDIT_C7_SCI',
    name: 'Credit Score',
    maxMarks: 20,
    entryType: 'formula',
    formulaConfig: { type: 'sum', of: ['ATT_SCI', 'DISC'] },
    role: 'creditScore',
  },

  // Sunrise Academy
  { id: 6, schoolId: 2, code: 'PT', name: 'PT', maxMarks: 20, entryType: 'direct', formulaConfig: null },
  { id: 7, schoolId: 2, code: 'MA', name: 'MA', maxMarks: 5, entryType: 'direct', formulaConfig: null },
  {
    id: 8,
    schoolId: 2,
    code: 'HY',
    name: 'First Half',
    maxMarks: 6,
    entryType: 'formula',
    formulaConfig: { type: 'percentOf', of: 'PT', percent: 0.3 },
  },
  { id: 9, schoolId: 2, code: 'SEA', name: 'SEA', maxMarks: 10, entryType: 'direct', formulaConfig: null },
  { id: 10, schoolId: 2, code: 'TE', name: 'TE', maxMarks: 70, entryType: 'direct', formulaConfig: null },
];

module.exports = assessmentComponents;
