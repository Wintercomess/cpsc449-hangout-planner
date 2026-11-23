const express = require('express');

const healthRoutes = require('./health.routes');

const router = express.Router();

router.use('/health', healthRoutes);

const authRoutes = require('./auth.routes');
router.use('/auth', authRoutes);

const groupRoutes = require('./group.routes');
router.use('/groups', groupRoutes);

const memberRoutes = require('./member.routes');
router.use('/groups', memberRoutes);

const locationRoutes = require('./location.routes');
router.use('/location', locationRoutes);

const itineraryRoutes =  require('./itinerary.routes')
router.use('/itineraries', itineraryRoutes);

// Add new route files here, e.g.:
// router.use('/groups', require('./group.routes'));

module.exports = router;
