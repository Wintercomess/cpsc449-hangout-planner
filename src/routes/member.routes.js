const express = require('express');
const { joinGroup, listMembers, changeMemberRole } = require('../controllers/member.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireGroupRole } = require('../middleware/groupRbac.middleware');

const router = express.Router();

// Mounted at /api/groups (next to the group CRUD routes)
router.post('/join', requireAuth, joinGroup);
router.get('/:groupId/members', requireAuth, requireGroupRole('owner', 'organizer', 'member'), listMembers);
router.patch('/:groupId/members/:userId', requireAuth, requireGroupRole('owner'), changeMemberRole);

module.exports = router;
