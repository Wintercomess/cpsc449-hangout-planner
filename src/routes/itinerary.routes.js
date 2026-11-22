// src/routes/itinerary.routes.js
const express = require('express');
const router = express.Router();
// const { requireAuth } = require('../middleware/auth.middleware');
// const { requireGroupRole } = require('../middleware/groupRbac.middleware');
const { createItinerary } = require('../controllers/itinerary.controller');

router.post(
  '/groups/:groupId',
  // requireAuth,
  // requireGroupRole('owner', 'organizer', 'member'),
  createItinerary
);

module.exports = router;