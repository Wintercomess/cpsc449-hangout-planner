// src/routes/guide.routes.js
const express = require('express');
const { search, getGuide } = require('../controllers/guide.controller');

const router = express.Router();

// GET /api/guides/search?q=fullerton
router.get('/search', search);

// GET /api/guides?destination=Fullerton&types=see,do,eat,drink&limit=5
router.get('/', getGuide);

module.exports = router;
