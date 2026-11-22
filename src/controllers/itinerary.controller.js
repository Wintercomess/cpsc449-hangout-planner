// src/controllers/itinerary.controller.js
const { generateGroupItinerary } = require('../services/itinerary.service');

async function createItinerary(req, res) {
  const { destination, date, preferences, locations, guideSummary, groupName } = req.body || {};

  if (!destination || !destination.trim()) {
    const err = new Error('destination is required');
    err.status = 400;
    throw err;
  }

  // Fallback while auth/RBAC middleware is commented out
  const group = req.group || {
    _id: req.params.groupId,
    name: groupName || 'Weekend Hangout',
    members: [],
  };

  const result = await generateGroupItinerary({
    group, // <-- change from group: req.group
    destination: destination.trim(),
    date,
    preferences,
    locations,
    guideSummary,
  });

  res.status(201).json({
    groupId: group._id,
    ...result,
  });
}

module.exports = { createItinerary };