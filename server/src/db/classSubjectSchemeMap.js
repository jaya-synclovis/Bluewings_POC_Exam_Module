// Which scheme applies to a given class + subject (+ term, when the
// school's schemes are term-tagged). A class+subject can have more than one
// row here — one per term — which is exactly why resolving a scheme needs
// the term as well as the class/subject once more than one row matches.
const classSubjectSchemeMap = [
  { id: 1, classId: 1, subjectId: 1, schemeId: 4 }, // Greenwood Class 6 Maths
  { id: 2, classId: 1, subjectId: 2, schemeId: 5 }, // Greenwood Class 6 Science
  { id: 3, classId: 2, subjectId: 1, schemeId: 6 }, // Greenwood Class 7 Maths
  { id: 4, classId: 2, subjectId: 2, schemeId: 7 }, // Greenwood Class 7 Science

  { id: 5, classId: 3, subjectId: 3, schemeId: 2 }, // Sunrise Class 6 Maths, Term 1
  { id: 6, classId: 3, subjectId: 4, schemeId: 2 }, // Sunrise Class 6 English, Term 1
  { id: 7, classId: 4, subjectId: 3, schemeId: 2 }, // Sunrise Class 7 Maths, Term 1
  { id: 8, classId: 4, subjectId: 4, schemeId: 2 }, // Sunrise Class 7 English, Term 1

  { id: 9, classId: 3, subjectId: 3, schemeId: 3 }, // Sunrise Class 6 Maths, Term 2
  { id: 10, classId: 3, subjectId: 4, schemeId: 3 }, // Sunrise Class 6 English, Term 2
  { id: 11, classId: 4, subjectId: 3, schemeId: 3 }, // Sunrise Class 7 Maths, Term 2
  { id: 12, classId: 4, subjectId: 4, schemeId: 3 }, // Sunrise Class 7 English, Term 2
];

module.exports = classSubjectSchemeMap;
