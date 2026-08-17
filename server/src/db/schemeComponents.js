// Join table: which components belong to a scheme, in what order, and
// where they're rendered. Two independent visibility flags:
//   - `isVisible`: shows as a Marks Entry column (teacher enters/sees it).
//   - `showInReportCard`: shows as a Report Card column (final result).
// Credit Score's raw inputs (Attendance, Discipline, Certification, ...) are
// `isVisible: true` (a teacher can see/edit them while entering marks) but
// `showInReportCard: false` (they never leak into the final report — only
// the derived Credit Score does).
const schemeComponents = [
  // Greenwood — Maths, Class 6
  { schemeId: 4, componentId: 1, displayOrder: 1, isVisible: true }, // UT-I
  { schemeId: 4, componentId: 2, displayOrder: 2, isVisible: true }, // HYE-Th
  { schemeId: 4, componentId: 15, displayOrder: 3, isVisible: true }, // UT-I + HYE-Th (Class 6 Maths)
  { schemeId: 4, componentId: 3, displayOrder: 4, isVisible: true }, // HYE-Pr
  { schemeId: 4, componentId: 4, displayOrder: 5, isVisible: true }, // UT-II
  { schemeId: 4, componentId: 5, displayOrder: 6, isVisible: true }, // AE-Th
  { schemeId: 4, componentId: 25, displayOrder: 7, isVisible: true }, // UT-II + AE-Th (Class 6 Maths)
  { schemeId: 4, componentId: 24, displayOrder: 8, isVisible: true }, // AE-Pr
  { schemeId: 4, componentId: 30, displayOrder: 9, isVisible: true }, // Total (Theory) (Class 6 Maths)
  { schemeId: 4, componentId: 34, displayOrder: 10, isVisible: true }, // Total Practical (Class 6 Maths)
  // Credit Score inputs available to Maths: global fields only (Maths has
  // no subject-scoped field of its own). Editable in Marks Entry, hidden
  // from the Report Card.
  { schemeId: 4, componentId: 11, displayOrder: 11, isVisible: true, showInReportCard: false }, // Total Attendance
  { schemeId: 4, componentId: 16, displayOrder: 12, isVisible: true, showInReportCard: false }, // Certification
  { schemeId: 4, componentId: 18, displayOrder: 13, isVisible: true, showInReportCard: false }, // Homework Completion
  { schemeId: 4, componentId: 29, displayOrder: 14, isVisible: true, showInReportCard: false }, // Marks Entered
  { schemeId: 4, componentId: 13, displayOrder: 15, isVisible: true }, // Credit Score (Class 6 Maths formula)

  // Greenwood — Science, Class 6 (same visible fields, but its OWN Half
  // Yearly/Annual/Total/Credit Score components, each with their own
  // formula and, for Credit Score, its own subject-scoped input)
  { schemeId: 5, componentId: 1, displayOrder: 1, isVisible: true },
  { schemeId: 5, componentId: 2, displayOrder: 2, isVisible: true },
  { schemeId: 5, componentId: 19, displayOrder: 3, isVisible: true }, // UT-I + HYE-Th (Class 6 Science)
  { schemeId: 5, componentId: 3, displayOrder: 4, isVisible: true },
  { schemeId: 5, componentId: 4, displayOrder: 5, isVisible: true },
  { schemeId: 5, componentId: 5, displayOrder: 6, isVisible: true },
  { schemeId: 5, componentId: 26, displayOrder: 7, isVisible: true }, // UT-II + AE-Th (Class 6 Science)
  { schemeId: 5, componentId: 24, displayOrder: 8, isVisible: true },
  { schemeId: 5, componentId: 31, displayOrder: 9, isVisible: true }, // Total (Theory) (Class 6 Science)
  { schemeId: 5, componentId: 35, displayOrder: 10, isVisible: true }, // Total Practical (Class 6 Science)
  // Credit Score inputs available to Science: global fields + its own
  // subject-scoped Attendance (Science).
  { schemeId: 5, componentId: 11, displayOrder: 11, isVisible: true, showInReportCard: false }, // Total Attendance
  { schemeId: 5, componentId: 12, displayOrder: 12, isVisible: true, showInReportCard: false }, // Discipline
  { schemeId: 5, componentId: 16, displayOrder: 13, isVisible: true, showInReportCard: false }, // Certification
  { schemeId: 5, componentId: 18, displayOrder: 14, isVisible: true, showInReportCard: false }, // Homework Completion
  { schemeId: 5, componentId: 17, displayOrder: 15, isVisible: true, showInReportCard: false }, // Attendance (Science)
  { schemeId: 5, componentId: 29, displayOrder: 16, isVisible: true, showInReportCard: false }, // Marks Entered
  { schemeId: 5, componentId: 14, displayOrder: 17, isVisible: true }, // Credit Score (Class 6 Science formula)

  // Greenwood — Maths, Class 7 (same component vocabulary as Class 6 Maths,
  // but its OWN Half Yearly/Annual/Total/Credit Score components —
  // configuring one class's formula never touches the other's).
  { schemeId: 6, componentId: 1, displayOrder: 1, isVisible: true },
  { schemeId: 6, componentId: 2, displayOrder: 2, isVisible: true },
  { schemeId: 6, componentId: 20, displayOrder: 3, isVisible: true }, // UT-I + HYE-Th (Class 7 Maths)
  { schemeId: 6, componentId: 3, displayOrder: 4, isVisible: true },
  { schemeId: 6, componentId: 4, displayOrder: 5, isVisible: true },
  { schemeId: 6, componentId: 5, displayOrder: 6, isVisible: true },
  { schemeId: 6, componentId: 27, displayOrder: 7, isVisible: true }, // UT-II + AE-Th (Class 7 Maths)
  { schemeId: 6, componentId: 24, displayOrder: 8, isVisible: true },
  { schemeId: 6, componentId: 32, displayOrder: 9, isVisible: true }, // Total (Theory) (Class 7 Maths)
  { schemeId: 6, componentId: 36, displayOrder: 10, isVisible: true }, // Total Practical (Class 7 Maths)
  { schemeId: 6, componentId: 11, displayOrder: 11, isVisible: true, showInReportCard: false },
  { schemeId: 6, componentId: 16, displayOrder: 12, isVisible: true, showInReportCard: false },
  { schemeId: 6, componentId: 18, displayOrder: 13, isVisible: true, showInReportCard: false },
  { schemeId: 6, componentId: 29, displayOrder: 14, isVisible: true, showInReportCard: false },
  { schemeId: 6, componentId: 22, displayOrder: 15, isVisible: true }, // Credit Score (Class 7 Maths formula)

  // Greenwood — Science, Class 7
  { schemeId: 7, componentId: 1, displayOrder: 1, isVisible: true },
  { schemeId: 7, componentId: 2, displayOrder: 2, isVisible: true },
  { schemeId: 7, componentId: 21, displayOrder: 3, isVisible: true }, // UT-I + HYE-Th (Class 7 Science)
  { schemeId: 7, componentId: 3, displayOrder: 4, isVisible: true },
  { schemeId: 7, componentId: 4, displayOrder: 5, isVisible: true },
  { schemeId: 7, componentId: 5, displayOrder: 6, isVisible: true },
  { schemeId: 7, componentId: 28, displayOrder: 7, isVisible: true }, // UT-II + AE-Th (Class 7 Science)
  { schemeId: 7, componentId: 24, displayOrder: 8, isVisible: true },
  { schemeId: 7, componentId: 33, displayOrder: 9, isVisible: true }, // Total (Theory) (Class 7 Science)
  { schemeId: 7, componentId: 37, displayOrder: 10, isVisible: true }, // Total Practical (Class 7 Science)
  { schemeId: 7, componentId: 11, displayOrder: 11, isVisible: true, showInReportCard: false },
  { schemeId: 7, componentId: 12, displayOrder: 12, isVisible: true, showInReportCard: false },
  { schemeId: 7, componentId: 16, displayOrder: 13, isVisible: true, showInReportCard: false },
  { schemeId: 7, componentId: 18, displayOrder: 14, isVisible: true, showInReportCard: false },
  { schemeId: 7, componentId: 17, displayOrder: 15, isVisible: true, showInReportCard: false },
  { schemeId: 7, componentId: 29, displayOrder: 16, isVisible: true, showInReportCard: false },
  { schemeId: 7, componentId: 23, displayOrder: 17, isVisible: true }, // Credit Score (Class 7 Science formula)

  // Sunrise — Term 1
  { schemeId: 2, componentId: 6, displayOrder: 1, isVisible: true },
  { schemeId: 2, componentId: 7, displayOrder: 2, isVisible: true },
  { schemeId: 2, componentId: 8, displayOrder: 3, isVisible: true },
  { schemeId: 2, componentId: 9, displayOrder: 4, isVisible: true },
  { schemeId: 2, componentId: 10, displayOrder: 5, isVisible: true },

  // Term 2 reuses the exact same component rows as Term 1 — same fields,
  // scored again later in the year, not a new vocabulary.
  { schemeId: 3, componentId: 6, displayOrder: 1, isVisible: true },
  { schemeId: 3, componentId: 7, displayOrder: 2, isVisible: true },
  { schemeId: 3, componentId: 8, displayOrder: 3, isVisible: true },
  { schemeId: 3, componentId: 9, displayOrder: 4, isVisible: true },
  { schemeId: 3, componentId: 10, displayOrder: 5, isVisible: true },
];

module.exports = schemeComponents;
