const express = require('express');
const cors = require('cors');
const schoolsRouter = require('./routes/schools');
const studentsRouter = require('./routes/students');
const structuresRouter = require('./routes/structures');
const assessmentConfigRouter = require('./routes/assessmentConfig');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/schools', schoolsRouter);
app.use('/api/schools', structuresRouter);
app.use('/api/schools', assessmentConfigRouter);
app.use('/api', studentsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Report card server listening on http://localhost:${PORT}`);
});
