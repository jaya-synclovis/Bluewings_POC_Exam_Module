// A named bundle of components + a total formula. `term` is optional —
// schools that don't divide into terms leave it null. A scheme gets its
// total either inline (`totalFormulaConfig`, e.g. Sunrise below) or by
// pointing at a shared, reusable `structureId` (see assessmentStructures.js)
// — Greenwood's Maths and Science schemes share one structure, so editing
// it via the Assessment Structure builder updates both subjects at once.
const examSchemes = [
  // Class 6 and Class 7 get their OWN scheme per subject (rather than
  // sharing one) so Half Yearly and Credit Score can be configured
  // independently per class — see assessmentComponents.js's HY_C6_MATHS /
  // HY_C7_MATHS / CREDIT_MATHS / CREDIT_C7_MATHS family of components.
  { id: 4, schoolId: 1, term: null, name: 'Greenwood Maths Scheme (Class 6)', structureId: 1 },
  { id: 5, schoolId: 1, term: null, name: 'Greenwood Science Scheme (Class 6)', structureId: 1 },
  { id: 6, schoolId: 1, term: null, name: 'Greenwood Maths Scheme (Class 7)', structureId: 1 },
  { id: 7, schoolId: 1, term: null, name: 'Greenwood Science Scheme (Class 7)', structureId: 1 },
  {
    id: 2,
    schoolId: 2,
    term: 'Term 1',
    name: 'Sunrise Term 1 Scheme',
    totalFormulaConfig: {
      type: 'weightedGroups',
      groups: [
        { keys: ['PT', 'MA', 'HY'], weight: 0.3 },
        { keys: ['SEA'], weight: 0.1 },
        { keys: ['TE'], weight: 0.6 },
      ],
    },
  },
  {
    id: 3,
    schoolId: 2,
    term: 'Term 2',
    name: 'Sunrise Term 2 Scheme',
    totalFormulaConfig: {
      type: 'weightedGroups',
      groups: [
        { keys: ['PT', 'MA', 'HY'], weight: 0.3 },
        { keys: ['SEA'], weight: 0.1 },
        { keys: ['TE'], weight: 0.6 },
      ],
    },
  },
];

module.exports = examSchemes;
