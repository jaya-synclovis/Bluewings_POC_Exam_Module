// Joins the normalized tables the way a SQL query would, and reshapes the
// result into the flat { components, totalFormula, gradeScale } contract
// that formulaEngine.js (and the frontend) already understand. This is the
// ONLY place that knows about the table structure — routes never touch the
// db/ arrays directly for anything beyond a plain lookup.
const schools = require('../db/schools');
const classes = require('../db/classes');
const subjects = require('../db/subjects');
const assessmentComponents = require('../db/assessmentComponents');
const examSchemes = require('../db/examSchemes');
const schemeComponents = require('../db/schemeComponents');
const classSubjectSchemeMap = require('../db/classSubjectSchemeMap');
const gradeScales = require('../db/gradeScales');
const assessmentStructures = require('../db/assessmentStructures');
const { formulaKeys } = require('../engine/formulaEngine');

function getSchool(schoolId) {
  return schools.find((s) => s.id === schoolId);
}

function getSchoolClasses(schoolId) {
  return classes.filter((c) => c.schoolId === schoolId);
}

function getSchoolSubjects(schoolId) {
  return subjects.filter((s) => s.schoolId === schoolId);
}

// Distinct, ordered list of terms this school's schemes use — empty if the
// school doesn't divide into terms at all (its schemes have term: null).
function getSchoolTerms(schoolId) {
  const terms = examSchemes.filter((s) => s.schoolId === schoolId && s.term).map((s) => s.term);
  return [...new Set(terms)];
}

function findComponentByCode(schoolId, code) {
  return assessmentComponents.find((c) => c.schoolId === schoolId && c.code === code);
}

// `order` carries the link's displayOrder through to the client — needed so
// that when two subjects' fields merge into one column by label (e.g. each
// subject's own Credit Score), the merged list can be sorted by where each
// contributing subject actually placed it, not just by which subject's rows
// happened to be processed first.
function reshapeComponent(row, order) {
  return {
    key: row.code,
    label: row.name,
    max: row.maxMarks,
    type: row.entryType,
    formula: row.formulaConfig || undefined,
    order,
  };
}

// A scheme's total formula either lives inline on the scheme row, or is
// shared via a `structureId` pointer into assessmentStructures — editing a
// shared structure changes the total for every scheme that points at it.
function totalFormulaForScheme(scheme) {
  if (scheme.structureId) {
    const structure = assessmentStructures.find((s) => s.id === scheme.structureId);
    return structure.totalFormulaConfig;
  }
  return scheme.totalFormulaConfig;
}

// Resolves which scheme applies to a class+subject, then joins its
// components (in display order) and grade scale. A class+subject can map to
// more than one scheme (one per term) — `term` picks which; if omitted, the
// first mapped scheme is used (fine for schools that don't split into terms).
//
// Returns THREE component lists:
//   - `allComponents`: everything linked into the scheme, including hidden
//     ones — needed so a formula can reach a hidden input.
//   - `components`: what Marks Entry renders, and what the total formula is
//     scoped to. A `creditScoreField`-role raw input only appears here while
//     this scheme's own Credit Score formula actually references it — flip a
//     field off the formula and it drops out of Marks Entry (its marks
//     aren't lost, just not rendered) until something references it again.
//   - `reportComponents`: `components` further filtered to `showInReportCard
//     !== false` — what the Report Card renders. Credit Score's raw inputs
//     are excluded here regardless, so only the derived Credit Score itself
//     ever reaches the final report.
function resolveScheme(schoolId, className, subjectName, term) {
  const classRow = classes.find((c) => c.schoolId === schoolId && c.name === className);
  const subjectRow = subjects.find((s) => s.schoolId === schoolId && s.name === subjectName);
  if (!classRow || !subjectRow) return null;

  const mappings = classSubjectSchemeMap.filter((m) => m.classId === classRow.id && m.subjectId === subjectRow.id);
  if (!mappings.length) return null;

  const candidateSchemes = mappings.map((m) => examSchemes.find((s) => s.id === m.schemeId));
  const scheme = term ? candidateSchemes.find((s) => s.term === term) : candidateSchemes[0];
  if (!scheme) return null;

  const links = schemeComponents.filter((link) => link.schemeId === scheme.id).sort((a, b) => a.displayOrder - b.displayOrder);
  const allComponents = links.map((link) => reshapeComponent(assessmentComponents.find((c) => c.id === link.componentId), link.displayOrder));

  const creditScoreLink = links.find((link) => {
    const component = assessmentComponents.find((c) => c.id === link.componentId);
    return component && component.role === 'creditScore';
  });
  const creditScoreComponent = creditScoreLink && assessmentComponents.find((c) => c.id === creditScoreLink.componentId);
  const usedCreditFieldKeys = new Set(
    creditScoreComponent && creditScoreComponent.formulaConfig ? formulaKeys(creditScoreComponent.formulaConfig) : []
  );

  const visibleLinks = links.filter((link) => {
    if (link.isVisible === false) return false;
    const component = assessmentComponents.find((c) => c.id === link.componentId);
    if (component.role === 'creditScoreField') return usedCreditFieldKeys.has(component.code);
    return true;
  });
  const components = visibleLinks.map((link) => reshapeComponent(assessmentComponents.find((c) => c.id === link.componentId), link.displayOrder));
  const reportComponents = visibleLinks
    .filter((link) => link.showInReportCard !== false)
    .map((link) => reshapeComponent(assessmentComponents.find((c) => c.id === link.componentId), link.displayOrder));

  // A scheme-specific grade scale overrides the school's default one.
  const schemeGradeRows = gradeScales.filter((g) => g.schemeId === scheme.id);
  const gradeRows = schemeGradeRows.length
    ? schemeGradeRows
    : gradeScales.filter((g) => g.schoolId === schoolId && g.schemeId === null);
  const gradeScale = gradeRows.map((g) => ({ min: g.minPercent, grade: g.gradeLabel }));

  return {
    classRow,
    subjectRow,
    scheme,
    components,
    reportComponents,
    allComponents,
    totalFormula: totalFormulaForScheme(scheme),
    gradeScale,
  };
}

// --- Assessment structures ---------------------------------------------
// Which class+subject(+term) combinations currently use a given structure —
// used to populate the builder's "Assigned classes" panel.
function getAssignedUsages(structureId) {
  const schemeIds = examSchemes.filter((s) => s.structureId === structureId).map((s) => s.id);
  return classSubjectSchemeMap
    .filter((m) => schemeIds.includes(m.schemeId))
    .map((m) => {
      const classRow = classes.find((c) => c.id === m.classId);
      const subjectRow = subjects.find((s) => s.id === m.subjectId);
      const scheme = examSchemes.find((s) => s.id === m.schemeId);
      return { class: classRow.name, subject: subjectRow.name, term: scheme.term };
    });
}

function getStructures(schoolId) {
  return assessmentStructures.filter((s) => s.schoolId === schoolId);
}

function getStructure(schoolId, structureId) {
  return assessmentStructures.find((s) => s.schoolId === schoolId && s.id === structureId);
}

// --- Half Yearly / Credit Score config ----------------------------------
// These helpers find components by `role` rather than by hardcoded code, so
// the config routes never need to know a specific component's code. Both
// Half Yearly and Credit Score are configured per (class, subject) — Class 6
// Maths and Class 7 Maths resolve to completely independent components even
// though both display under the same label ("Half Yearly", "Credit Score").

// The scheme id one specific (class, subject) pair resolves to.
function getSchemeIdForClassSubject(schoolId, className, subjectName) {
  const classRow = classes.find((c) => c.schoolId === schoolId && c.name === className);
  const subjectRow = subjects.find((s) => s.schoolId === schoolId && s.name === subjectName);
  if (!classRow || !subjectRow) return null;
  const mapping = classSubjectSchemeMap.find((m) => m.classId === classRow.id && m.subjectId === subjectRow.id);
  return mapping ? mapping.schemeId : null;
}

// The component with the given `role` linked into one (class, subject)'s
// own scheme.
function getComponentByRoleForClassSubject(schoolId, className, subjectName, role) {
  const schemeId = getSchemeIdForClassSubject(schoolId, className, subjectName);
  if (!schemeId) return null;
  const link = schemeComponents.find((l) => {
    if (l.schemeId !== schemeId) return false;
    const component = assessmentComponents.find((c) => c.id === l.componentId);
    return component && component.role === role;
  });
  return link ? assessmentComponents.find((c) => c.id === link.componentId) : null;
}

// Raw fields available to compose a (class, subject)'s Credit Score formula:
// global fields (usable anywhere) plus fields scoped to this one subject.
// Raw fields themselves are NOT class-scoped — the same Attendance/Discipline
// pool can feed either class's formula, even though each class's formula is
// configured independently.
function getRawFieldsForSubject(schoolId, subjectName) {
  return assessmentComponents.filter(
    (c) =>
      c.schoolId === schoolId &&
      c.role === 'creditScoreField' &&
      (c.scope === 'global' || (c.scope === 'subject' && c.subjectName === subjectName))
  );
}

// Every (class, subject) combination at this school that has its own Credit
// Score field — used to decide which schemes a newly added raw field needs
// linking into.
function getCreditScoreClassSubjectPairs(schoolId) {
  const pairs = [];
  getSchoolClasses(schoolId).forEach((classRow) => {
    getSchoolSubjects(schoolId).forEach((subjectRow) => {
      if (getComponentByRoleForClassSubject(schoolId, classRow.name, subjectRow.name, 'creditScore')) {
        pairs.push({ className: classRow.name, subjectName: subjectRow.name });
      }
    });
  });
  return pairs;
}

module.exports = {
  getSchool,
  getSchoolClasses,
  getSchoolSubjects,
  getSchoolTerms,
  findComponentByCode,
  resolveScheme,
  getStructures,
  getStructure,
  getAssignedUsages,
  getSchemeIdForClassSubject,
  getComponentByRoleForClassSubject,
  getRawFieldsForSubject,
  getCreditScoreClassSubjectPairs,
};
