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
  // Greenwood High — Half Yearly Exam group: shared raw input fields (same
  // component id, different mark rows per subject/scheme — same pattern as
  // any other direct field shared across schemes).
  { id: 1, schoolId: 1, code: 'UT1', name: 'UT-I', maxMarks: 20, entryType: 'direct', formulaConfig: null, group: 'Half Yearly Exam' },
  { id: 2, schoolId: 1, code: 'HYE_TH', name: 'HYE-Th', maxMarks: 80, entryType: 'direct', formulaConfig: null, group: 'Half Yearly Exam' },
  { id: 3, schoolId: 1, code: 'HYE_PR', name: 'HYE-Pr', maxMarks: 20, entryType: 'direct', formulaConfig: null, group: 'Half Yearly Exam' },
  // Annual Exam group — mirrors Half Yearly Exam's shape.
  { id: 4, schoolId: 1, code: 'UT2', name: 'UT-II', maxMarks: 20, entryType: 'direct', formulaConfig: null, group: 'Annual Exam' },
  { id: 5, schoolId: 1, code: 'AE_TH', name: 'AE-Th', maxMarks: 80, entryType: 'direct', formulaConfig: null, group: 'Annual Exam' },
  { id: 24, schoolId: 1, code: 'AE_PR', name: 'AE-Pr', maxMarks: 20, entryType: 'direct', formulaConfig: null, group: 'Annual Exam' },

  // Half Yearly combined (UT-I + HYE-Th): one component per (class, subject)
  // — same display label everywhere, but each independently configurable
  // (Class 6 Maths can use a different formula than Class 7 Maths, or from
  // Class 6/7 Science).
  {
    id: 15,
    schoolId: 1,
    code: 'HYE_COMB_C6_MATHS',
    name: 'UT-I (20) + HYE-Th (60/50)',
    maxMarks: 80,
    entryType: 'formula',
    formulaConfig: {
      type: 'linearCombination',
      parts: [
        { of: 'UT1', weight: 1 },
        { of: 'HYE_TH', weight: 0.75 },
      ],
    },
    role: 'halfYearly',
    group: 'Half Yearly Exam',
  },
  {
    id: 19,
    schoolId: 1,
    code: 'HYE_COMB_C6_SCI',
    name: 'UT-I (20) + HYE-Th (60/50)',
    maxMarks: 80,
    entryType: 'formula',
    formulaConfig: {
      type: 'linearCombination',
      parts: [
        { of: 'UT1', weight: 1 },
        { of: 'HYE_TH', weight: 0.75 },
      ],
    },
    role: 'halfYearly',
    group: 'Half Yearly Exam',
  },
  {
    id: 20,
    schoolId: 1,
    code: 'HYE_COMB_C7_MATHS',
    name: 'UT-I (20) + HYE-Th (60/50)',
    maxMarks: 80,
    entryType: 'formula',
    formulaConfig: {
      type: 'linearCombination',
      parts: [
        { of: 'UT1', weight: 1 },
        { of: 'HYE_TH', weight: 0.75 },
      ],
    },
    role: 'halfYearly',
    group: 'Half Yearly Exam',
  },
  {
    id: 21,
    schoolId: 1,
    code: 'HYE_COMB_C7_SCI',
    name: 'UT-I (20) + HYE-Th (60/50)',
    maxMarks: 80,
    entryType: 'formula',
    formulaConfig: {
      type: 'linearCombination',
      parts: [
        { of: 'UT1', weight: 1 },
        { of: 'HYE_TH', weight: 0.75 },
      ],
    },
    role: 'halfYearly',
    group: 'Half Yearly Exam',
  },

  // Annual combined (UT-II + AE-Th): same shape as Half Yearly combined, one
  // independent component per (class, subject). Not exposed on its own
  // Assessment Structure section (only Half Yearly, Total (Theory), Total
  // Practical and Credit Score are) but still driven by the same generic
  // formula engine.
  {
    id: 25,
    schoolId: 1,
    code: 'AE_COMB_C6_MATHS',
    name: 'UT-II (20) + AE-Th (60/50)',
    maxMarks: 80,
    entryType: 'formula',
    formulaConfig: {
      type: 'linearCombination',
      parts: [
        { of: 'UT2', weight: 1 },
        { of: 'AE_TH', weight: 0.75 },
      ],
    },
    role: 'annual',
    group: 'Annual Exam',
  },
  {
    id: 26,
    schoolId: 1,
    code: 'AE_COMB_C6_SCI',
    name: 'UT-II (20) + AE-Th (60/50)',
    maxMarks: 80,
    entryType: 'formula',
    formulaConfig: {
      type: 'linearCombination',
      parts: [
        { of: 'UT2', weight: 1 },
        { of: 'AE_TH', weight: 0.75 },
      ],
    },
    role: 'annual',
    group: 'Annual Exam',
  },
  {
    id: 27,
    schoolId: 1,
    code: 'AE_COMB_C7_MATHS',
    name: 'UT-II (20) + AE-Th (60/50)',
    maxMarks: 80,
    entryType: 'formula',
    formulaConfig: {
      type: 'linearCombination',
      parts: [
        { of: 'UT2', weight: 1 },
        { of: 'AE_TH', weight: 0.75 },
      ],
    },
    role: 'annual',
    group: 'Annual Exam',
  },
  {
    id: 28,
    schoolId: 1,
    code: 'AE_COMB_C7_SCI',
    name: 'UT-II (20) + AE-Th (60/50)',
    maxMarks: 80,
    entryType: 'formula',
    formulaConfig: {
      type: 'linearCombination',
      parts: [
        { of: 'UT2', weight: 1 },
        { of: 'AE_TH', weight: 0.75 },
      ],
    },
    role: 'annual',
    group: 'Annual Exam',
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
    group: 'Final Assessment',
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
    group: 'Final Assessment',
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
    group: 'Final Assessment',
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
    group: 'Final Assessment',
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
    group: 'Final Assessment',
  },
  {
    id: 29,
    schoolId: 1,
    code: 'CS_MARKS',
    name: 'Marks Entered',
    maxMarks: 10,
    entryType: 'direct',
    formulaConfig: null,
    role: 'creditScoreField',
    scope: 'global',
    source: 'manual',
    group: 'Final Assessment',
  },

  // Total (Theory): 30% of the Half Yearly combined field + 70% of the
  // Annual combined field — its own Assessment Structure section, one
  // independent component per (class, subject).
  {
    id: 30,
    schoolId: 1,
    code: 'TOTAL_TH_C6_MATHS',
    name: 'Total (30% of HYE + 70% of AE) (A)',
    maxMarks: 80,
    entryType: 'formula',
    formulaConfig: {
      type: 'linearCombination',
      parts: [
        { of: 'HYE_COMB_C6_MATHS', weight: 0.3 },
        { of: 'AE_COMB_C6_MATHS', weight: 0.7 },
      ],
    },
    role: 'totalTheory',
    group: 'Final Assessment',
  },
  {
    id: 31,
    schoolId: 1,
    code: 'TOTAL_TH_C6_SCI',
    name: 'Total (30% of HYE + 70% of AE) (A)',
    maxMarks: 80,
    entryType: 'formula',
    formulaConfig: {
      type: 'linearCombination',
      parts: [
        { of: 'HYE_COMB_C6_SCI', weight: 0.3 },
        { of: 'AE_COMB_C6_SCI', weight: 0.7 },
      ],
    },
    role: 'totalTheory',
    group: 'Final Assessment',
  },
  {
    id: 32,
    schoolId: 1,
    code: 'TOTAL_TH_C7_MATHS',
    name: 'Total (30% of HYE + 70% of AE) (A)',
    maxMarks: 80,
    entryType: 'formula',
    formulaConfig: {
      type: 'linearCombination',
      parts: [
        { of: 'HYE_COMB_C7_MATHS', weight: 0.3 },
        { of: 'AE_COMB_C7_MATHS', weight: 0.7 },
      ],
    },
    role: 'totalTheory',
    group: 'Final Assessment',
  },
  {
    id: 33,
    schoolId: 1,
    code: 'TOTAL_TH_C7_SCI',
    name: 'Total (30% of HYE + 70% of AE) (A)',
    maxMarks: 80,
    entryType: 'formula',
    formulaConfig: {
      type: 'linearCombination',
      parts: [
        { of: 'HYE_COMB_C7_SCI', weight: 0.3 },
        { of: 'AE_COMB_C7_SCI', weight: 0.7 },
      ],
    },
    role: 'totalTheory',
    group: 'Final Assessment',
  },

  // Total Practical: 30% of HYE-Pr + 70% of AE-Pr — its own Assessment
  // Structure section, one independent component per (class, subject).
  {
    id: 34,
    schoolId: 1,
    code: 'TOTAL_PR_C6_MATHS',
    name: 'Total Practical (30% of HYE + 70% of AE) (A)',
    maxMarks: 20,
    entryType: 'formula',
    formulaConfig: {
      type: 'linearCombination',
      parts: [
        { of: 'HYE_PR', weight: 0.3 },
        { of: 'AE_PR', weight: 0.7 },
      ],
    },
    role: 'totalPractical',
    group: 'Final Assessment',
  },
  {
    id: 35,
    schoolId: 1,
    code: 'TOTAL_PR_C6_SCI',
    name: 'Total Practical (30% of HYE + 70% of AE) (A)',
    maxMarks: 20,
    entryType: 'formula',
    formulaConfig: {
      type: 'linearCombination',
      parts: [
        { of: 'HYE_PR', weight: 0.3 },
        { of: 'AE_PR', weight: 0.7 },
      ],
    },
    role: 'totalPractical',
    group: 'Final Assessment',
  },
  {
    id: 36,
    schoolId: 1,
    code: 'TOTAL_PR_C7_MATHS',
    name: 'Total Practical (30% of HYE + 70% of AE) (A)',
    maxMarks: 20,
    entryType: 'formula',
    formulaConfig: {
      type: 'linearCombination',
      parts: [
        { of: 'HYE_PR', weight: 0.3 },
        { of: 'AE_PR', weight: 0.7 },
      ],
    },
    role: 'totalPractical',
    group: 'Final Assessment',
  },
  {
    id: 37,
    schoolId: 1,
    code: 'TOTAL_PR_C7_SCI',
    name: 'Total Practical (30% of HYE + 70% of AE) (A)',
    maxMarks: 20,
    entryType: 'formula',
    formulaConfig: {
      type: 'linearCombination',
      parts: [
        { of: 'HYE_PR', weight: 0.3 },
        { of: 'AE_PR', weight: 0.7 },
      ],
    },
    role: 'totalPractical',
    group: 'Final Assessment',
  },

  // Credit Score: same display name, but a DIFFERENT component (different
  // code, so independently configurable) per (class, subject). Default
  // formula for all four: 40% Attendance + 40% marks the teacher enters +
  // 20% overall marks across both terms (10% Half Yearly combined + 10%
  // Annual combined) — admins can still repoint it at any other raw field
  // (Discipline, Certification, Homework, Attendance (Science), ...) or
  // formula type (Sum / Percentage / Weighted combination) via Credit Score
  // Configuration.
  {
    id: 13,
    schoolId: 1,
    code: 'CREDIT_MATHS',
    name: 'Credit Score',
    maxMarks: 24,
    entryType: 'formula',
    formulaConfig: {
      type: 'linearCombination',
      parts: [
        { of: 'ATT', weight: 0.4 },
        { of: 'CS_MARKS', weight: 0.4 },
        { of: 'HYE_COMB_C6_MATHS', weight: 0.1 },
        { of: 'AE_COMB_C6_MATHS', weight: 0.1 },
      ],
    },
    role: 'creditScore',
    group: 'Final Assessment',
  },
  {
    id: 14,
    schoolId: 1,
    code: 'CREDIT_SCI',
    name: 'Credit Score',
    maxMarks: 24,
    entryType: 'formula',
    formulaConfig: {
      type: 'linearCombination',
      parts: [
        { of: 'ATT', weight: 0.4 },
        { of: 'CS_MARKS', weight: 0.4 },
        { of: 'HYE_COMB_C6_SCI', weight: 0.1 },
        { of: 'AE_COMB_C6_SCI', weight: 0.1 },
      ],
    },
    role: 'creditScore',
    group: 'Final Assessment',
  },
  {
    id: 22,
    schoolId: 1,
    code: 'CREDIT_C7_MATHS',
    name: 'Credit Score',
    maxMarks: 24,
    entryType: 'formula',
    formulaConfig: {
      type: 'linearCombination',
      parts: [
        { of: 'ATT', weight: 0.4 },
        { of: 'CS_MARKS', weight: 0.4 },
        { of: 'HYE_COMB_C7_MATHS', weight: 0.1 },
        { of: 'AE_COMB_C7_MATHS', weight: 0.1 },
      ],
    },
    role: 'creditScore',
    group: 'Final Assessment',
  },
  {
    id: 23,
    schoolId: 1,
    code: 'CREDIT_C7_SCI',
    name: 'Credit Score',
    maxMarks: 24,
    entryType: 'formula',
    formulaConfig: {
      type: 'linearCombination',
      parts: [
        { of: 'ATT', weight: 0.4 },
        { of: 'CS_MARKS', weight: 0.4 },
        { of: 'HYE_COMB_C7_SCI', weight: 0.1 },
        { of: 'AE_COMB_C7_SCI', weight: 0.1 },
      ],
    },
    role: 'creditScore',
    group: 'Final Assessment',
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
