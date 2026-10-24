const express = require('express');

const healthRoutes = require('./health.routes');

const router = express.Router();

router.use('/health', healthRoutes);

// Add new route files here, e.g.:
// router.use('/groups', require('./group.routes'));
// router.use('/auth', require('./auth.routes'));

module.exports = router;
