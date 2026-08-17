// A named bundle of components + a total formula. `term` is optional —
// schools that don't divide into terms leave it null. A scheme gets its
// total either inline (`totalFormulaConfig`, e.g. below) or by pointing at a
// shared, reusable `structureId` (see assessmentStructures.js) for schemes
// whose total-formula keys are actually identical across subjects.
const examSchemes = [
  // Class 6 and Class 7 get their OWN scheme per subject (rather than
  // sharing one) so Half Yearly, Annual, Total (Theory)/(Practical) and
  // Credit Score can all be configured independently per class AND subject
  // — see assessmentComponents.js's HYE_COMB_*/AE_COMB_*/TOTAL_TH_*/
  // TOTAL_PR_*/CREDIT_* families. Because each scheme's Total is a blend of
  // its OWN Total (Theory)/Total Practical component codes, the total
  // formula lives inline per scheme rather than via a shared structureId.
  {
    id: 4,
    schoolId: 1,
    term: null,
    name: 'Greenwood Maths Scheme (Class 6)',
    totalFormulaConfig: {
      type: 'weightedGroups',
      groups: [{ keys: ['TOTAL_TH_C6_MATHS', 'TOTAL_PR_C6_MATHS'], weight: 1 }],
    },
  },
  {
    id: 5,
    schoolId: 1,
    term: null,
    name: 'Greenwood Science Scheme (Class 6)',
    totalFormulaConfig: {
      type: 'weightedGroups',
      groups: [{ keys: ['TOTAL_TH_C6_SCI', 'TOTAL_PR_C6_SCI'], weight: 1 }],
    },
  },
  {
    id: 6,
    schoolId: 1,
    term: null,
    name: 'Greenwood Maths Scheme (Class 7)',
    totalFormulaConfig: {
      type: 'weightedGroups',
      groups: [{ keys: ['TOTAL_TH_C7_MATHS', 'TOTAL_PR_C7_MATHS'], weight: 1 }],
    },
  },
  {
    id: 7,
    schoolId: 1,
    term: null,
    name: 'Greenwood Science Scheme (Class 7)',
    totalFormulaConfig: {
      type: 'weightedGroups',
      groups: [{ keys: ['TOTAL_TH_C7_SCI', 'TOTAL_PR_C7_SCI'], weight: 1 }],
    },
  },
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
