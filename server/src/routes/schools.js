const express = require('express');
const schools = require('../db/schools');
const {
  getSchool,
  getSchoolClasses,
  getSchoolSubjects,
  getSchoolTerms,
  resolveScheme,
} = require('../services/schemeResolver');

const router = express.Router();

// GET /api/schools -> just enough to populate the selector dropdowns. The
// actual mark-entry columns/formulas only get resolved once a class+subject
// (+ term, for schools that use one) is picked (see below).
router.get('/', (req, res) => {
  res.json(
    schools.map((school) => ({
      id: school.id,
      name: school.name,
      classes: getSchoolClasses(school.id).map((c) => c.name),
      subjects: getSchoolSubjects(school.id).map((s) => s.name),
      terms: getSchoolTerms(school.id),
    }))
  );
});

// GET /api/schools/:schoolId/scheme?class=&subject=&term= -> the resolved
// components/totalFormula/gradeScale for that specific class+subject(+term).
router.get('/:schoolId/scheme', (req, res) => {
  const schoolId = Number(req.params.schoolId);
  if (!getSchool(schoolId)) return res.status(404).json({ error: 'School not found' });

  const { class: className, subject: subjectName, term } = req.query;
  const resolved = resolveScheme(schoolId, className, subjectName, term);
  if (!resolved) return res.status(404).json({ error: 'No scheme configured for this class/subject/term' });

  res.json({
    components: resolved.components,
    reportComponents: resolved.reportComponents,
    totalFormula: resolved.totalFormula,
    gradeScale: resolved.gradeScale,
  });
});

module.exports = router;
