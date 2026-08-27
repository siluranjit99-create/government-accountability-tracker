const express = require('express');
const cors = require('cors');
const issuesRouter = require('./routes/issues');
const pinsRouter = require('./routes/pins');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/issues', issuesRouter);
app.use('/api/pins', pinsRouter);

const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:4000`));