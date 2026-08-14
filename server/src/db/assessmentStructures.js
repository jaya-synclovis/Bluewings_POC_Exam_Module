// A reusable, named total-formula "structure". One or more exam schemes
// point at a structure via `structureId` (see examSchemes.js) instead of
// carrying their own totalFormulaConfig — editing a structure (e.g. via the
// Assessment Structure builder) changes the total for every class/subject
// that uses it, without touching their scheme rows individually.
const assessmentStructures = [
  {
    id: 1,
    schoolId: 1,
    name: 'Standard Structure',
    // "Sum of all": one group covering every exam component at 100% weight,
    // so Total = (earned across all of them) / (max across all of them) *
    // 100 — a flat percentage rather than a weighted blend. Happens to equal
    // the raw mark sum here only because PT+MA+NBS_ATT+SEA+TE's maxes add up
    // to exactly 100; it stays a correct percentage even if that changes.
    totalFormulaConfig: {
      type: 'weightedGroups',
      groups: [{ keys: ['PT', 'MA', 'NBS_ATT', 'SEA', 'TE'], weight: 1 }],
    },
  },
];

module.exports = assessmentStructures;
