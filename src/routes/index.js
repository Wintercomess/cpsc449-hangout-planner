const express = require('express');

const healthRoutes = require('./health.routes');

const router = express.Router();

router.use('/health', healthRoutes);

const groupRoutes = require('./group.routes');
router.use('/groups', groupRoutes);

const locationRoutes = require('./location.routes');
router.use('/location', locationRoutes);

module.exports = router;

// Add new route files here, e.g.:
// router.use('/groups', require('./group.routes'));
// router.use('/auth', require('./auth.routes'));

module.exports = router;
