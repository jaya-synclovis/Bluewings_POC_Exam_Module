// `schemeId: null` = the school's default grade scale, used unless a
// specific scheme overrides it with its own rows.
const gradeScales = [
  { id: 1, schoolId: 1, schemeId: null, minPercent: 90, gradeLabel: 'A1' },
  { id: 2, schoolId: 1, schemeId: null, minPercent: 75, gradeLabel: 'A2' },
  { id: 3, schoolId: 1, schemeId: null, minPercent: 60, gradeLabel: 'B1' },
  { id: 4, schoolId: 1, schemeId: null, minPercent: 40, gradeLabel: 'B2' },
  { id: 5, schoolId: 1, schemeId: null, minPercent: 0, gradeLabel: 'C' },

  { id: 6, schoolId: 2, schemeId: null, minPercent: 85, gradeLabel: 'A' },
  { id: 7, schoolId: 2, schemeId: null, minPercent: 70, gradeLabel: 'B' },
  { id: 8, schoolId: 2, schemeId: null, minPercent: 50, gradeLabel: 'C' },
  { id: 9, schoolId: 2, schemeId: null, minPercent: 0, gradeLabel: 'D' },
];

module.exports = gradeScales;
