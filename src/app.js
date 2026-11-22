const path = require('path');
const express = require('express');
const cors = require('cors');

const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

// UI mockup (plain HTML/CSS/JS in /public), e.g. http://localhost:3000/
app.use(express.static(path.join(__dirname, '..', 'public')));

// All API routes live under /api (e.g. GET /api/health, POST /api/groups)
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
