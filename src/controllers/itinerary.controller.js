// src/controllers/itinerary.controller.js
const { generateGroupItinerary } = require('../services/itinerary.service');
const { getDestinationGuide } = require('../services/wikivoyage.service');

// Fill in destination guide notes from Wikivoyage when the client didn't send any.
// A failed lookup should never block itinerary generation, so errors are swallowed.
async function lookupGuide(destination) {
  try {
    const guide = await getDestinationGuide(destination);
    return guide ? { guideSummary: guide.guideSummary, url: guide.url, title: guide.title } : null;
  } catch (err) {
    console.warn(`Wikivoyage lookup failed for "${destination}": ${err.message}`);
    return null;
  }
}

async function createItinerary(req, res) {
  const { destination, date, preferences, locations, groupName } = req.body || {};
  let { guideSummary } = req.body || {};

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

  let guide = null;
  if (!guideSummary) {
    guide = await lookupGuide(destination.trim());
    guideSummary = guide?.guideSummary;
  }

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
    guide: guide ? { title: guide.title, url: guide.url } : null,
  });
}

module.exports = { createItinerary };
