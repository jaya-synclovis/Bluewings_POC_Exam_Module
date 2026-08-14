// One row per real student — a student belongs to a class, not a subject.
// Marks for each subject they take live separately in studentMarks.js.
let nextId = 1;
function makeStudent(schoolId, classId, name) {
  return { id: nextId++, schoolId, classId, name };
}

const students = [];

const greenwoodNames = ['Aarav Shah', 'Priya Nair', 'Kabir Singh', 'Meera Iyer'];
[1, 2].forEach((classId) => {
  greenwoodNames.forEach((name) => students.push(makeStudent(1, classId, name)));
});

const sunriseNames = ['Ishaan Verma', 'Ananya Rao', 'Vihaan Gupta', 'Diya Kapoor'];
[3, 4].forEach((classId) => {
  sunriseNames.forEach((name) => students.push(makeStudent(2, classId, name)));
});

module.exports = students;
