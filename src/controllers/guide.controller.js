// src/controllers/guide.controller.js
const { searchGuides, getDestinationGuide } = require('../services/wikivoyage.service');

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

function parseLimit(value, fallback, max) {
  if (value === undefined) return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > max) {
    throw badRequest(`limit must be a whole number from 1 to ${max}`);
  }
  return n;
}

// GET /api/guides/search?q=fullerton&limit=5
async function search(req, res) {
  const q = (req.query.q || '').trim();
  if (!q) throw badRequest('Search query (q) is required');

  const limit = parseLimit(req.query.limit, 5, 20);
  const results = await searchGuides(q, limit);

  res.status(200).json({ query: q, count: results.length, results });
}

// GET /api/guides?destination=Fullerton&types=see,eat&limit=5
async function getGuide(req, res) {
  const destination = (req.query.destination || '').trim();
  if (!destination) throw badRequest('destination is required');

  const limit = parseLimit(req.query.limit, 5, 25);
  const guide = await getDestinationGuide(destination, { types: req.query.types, limit });

  if (!guide) {
    return res.status(404).json({ error: `No Wikivoyage guide found for "${destination}"` });
  }

  res.status(200).json(guide);
}

module.exports = { search, getGuide };
