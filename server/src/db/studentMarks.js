// What the teacher actually enters. Scoped by (studentId, subjectId,
// schemeId, componentId) — schemeId matters once a subject has more than
// one scheme (e.g. Sunrise's Term 1 vs Term 2 both reuse the same PT/MA/...
// component rows), and subjectId matters because two subjects can share a
// scheme. There is deliberately no row for formula-type components (e.g.
// Sunrise's HY) — they are never stored, only computed on read.
const students = require('./students');
const subjects = require('./subjects');
const assessmentComponents = require('./assessmentComponents');
const examSchemes = require('./examSchemes');
const schemeComponents = require('./schemeComponents');
const classSubjectSchemeMap = require('./classSubjectSchemeMap');

const greenwoodNames = ['Aarav Shah', 'Priya Nair', 'Kabir Singh', 'Meera Iyer'];
// ATT/DISC/CS_MARKS feed the (hidden) Credit Score formula — same values
// regardless of subject, since attendance/discipline/entered-marks aren't
// subject-specific in reality.
const greenwoodPattern = [
  { UT1: 15, HYE_TH: 60, HYE_PR: 16, UT2: 16, AE_TH: 64, AE_PR: 17, ATT: 9, CS_MARKS: 8, DISC: 8 },
  { UT1: 13, HYE_TH: 55, HYE_PR: 15, UT2: 14, AE_TH: 58, AE_PR: 16, ATT: 8, CS_MARKS: 7, DISC: 9 },
  { UT1: 18, HYE_TH: 68, HYE_PR: 18, UT2: 19, AE_TH: 70, AE_PR: 19, ATT: 10, CS_MARKS: 9, DISC: 10 },
  { UT1: 10, HYE_TH: 42, HYE_PR: 12, UT2: 11, AE_TH: 45, AE_PR: 13, ATT: 7, CS_MARKS: 6, DISC: 7 },
];

const sunriseNames = ['Ishaan Verma', 'Ananya Rao', 'Vihaan Gupta', 'Diya Kapoor'];
// Two distinct patterns so Term 1 and Term 2 visibly differ in the demo.
const sunriseTerm1Pattern = [
  { PT: 15, MA: 4, SEA: 8, TE: 50 },
  { PT: 12, MA: 3, SEA: 6, TE: 45 },
  { PT: 18, MA: 5, SEA: 9, TE: 60 },
  { PT: 10, MA: 2, SEA: 5, TE: 40 },
];
const sunriseTerm2Pattern = [
  { PT: 17, MA: 5, SEA: 9, TE: 55 },
  { PT: 14, MA: 4, SEA: 7, TE: 50 },
  { PT: 19, MA: 5, SEA: 10, TE: 65 },
  { PT: 12, MA: 3, SEA: 6, TE: 45 },
];

function directComponentsForScheme(schemeId) {
  return schemeComponents
    .filter((link) => link.schemeId === schemeId)
    .map((link) => assessmentComponents.find((c) => c.id === link.componentId))
    .filter((c) => c.entryType === 'direct');
}

function patternFor(student, scheme) {
  if (student.schoolId === 1) {
    return greenwoodPattern[greenwoodNames.indexOf(student.name)];
  }
  const idx = sunriseNames.indexOf(student.name);
  return scheme.term === 'Term 2' ? sunriseTerm2Pattern[idx] : sunriseTerm1Pattern[idx];
}

let nextId = 1;
const studentMarks = [];

students.forEach((student) => {
  const studentSubjects = subjects.filter((s) => s.schoolId === student.schoolId);
  studentSubjects.forEach((subject) => {
    const mappings = classSubjectSchemeMap.filter(
      (m) => m.classId === student.classId && m.subjectId === subject.id
    );
    mappings.forEach((mapping) => {
      const scheme = examSchemes.find((s) => s.id === mapping.schemeId);
      const pattern = patternFor(student, scheme);
      directComponentsForScheme(scheme.id).forEach((component) => {
        let marksObtained = pattern[component.code];
        // A 'bluewings' field with no explicit demo value simulates an
        // auto-fetched external system — seed it with a random mark rather
        // than leaving it blank; still just an ordinary editable mark after.
        if (marksObtained === undefined && component.source === 'bluewings') {
          marksObtained = Math.round(Math.random() * component.maxMarks * 10) / 10;
        }
        studentMarks.push({
          id: nextId++,
          studentId: student.id,
          subjectId: subject.id,
          schemeId: scheme.id,
          componentId: component.id,
          marksObtained,
        });
      });
    });
  });
});

module.exports = studentMarks;
