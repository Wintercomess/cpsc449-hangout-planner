const express = require('express');
const router = express.Router();
const groupcontroller = require('../controllers/groupcontroller');

router.post('/', groupcontroller.createGroup);
router.get('/:id', groupcontroller.getGroupById);

module.exports = router;