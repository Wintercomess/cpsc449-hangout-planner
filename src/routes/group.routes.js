const express = require('express');
const router = express.Router();
const groupcontroller = require('../controllers/groupcontroller');

// router.post('/', groupcontroller.createGroup);
// router.get('/:id', groupcontroller.getGroupById);

router.get('/', (req, res) => {
  // Temporarily bypassing the database for Postman testing
  res.status(200).json({
    success: true,
    message: "Groups retrieved successfully",
    groups: [
      { id: 1, name: "LA Hacks Team", location: "Los Angeles" }
    ]
  });
});

module.exports = router;