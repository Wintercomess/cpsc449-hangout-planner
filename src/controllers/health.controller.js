const mongoose = require('mongoose');

const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

// Quick check that the server is up and connected to MongoDB.
function getHealth(req, res) {
  const db = DB_STATES[mongoose.connection.readyState] || 'unknown';
  res.status(db === 'connected' ? 200 : 503).json({
    status: db === 'connected' ? 'ok' : 'degraded',
    db,
    uptime: Math.round(process.uptime()),
  });
}

module.exports = { getHealth };
