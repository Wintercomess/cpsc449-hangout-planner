const Group = require('../models/Group');

// How roles get assigned:
//   - whoever creates a group becomes its owner (Group model does this)
//   - joining with an invite code makes you a member
//   - the owner can change a member's role to organizer or member

// POST /api/groups/join  { inviteCode }  (logged-in user)
async function joinGroup(req, res) {
  const { inviteCode } = req.body || {};
  if (typeof inviteCode !== 'string' || !inviteCode.trim()) {
    return res.status(400).json({ error: 'inviteCode is required' });
  }

  const group = await Group.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
  if (!group) {
    return res.status(404).json({ error: 'No group with that invite code' });
  }
  if (group.getMemberRole(req.user.userId)) {
    return res.status(409).json({ error: 'You are already in this group' });
  }

  group.members.push({ user: req.user.userId, role: 'member' });
  await group.save();
  res.status(200).json({ message: 'Joined group', groupId: group._id, role: 'member' });
}

// GET /api/groups/:groupId/members  (any member of the group)
async function listMembers(req, res) {
  await req.group.populate('members.user', 'name email');
  res.json({ groupId: req.group._id, yourRole: req.groupRole, members: req.group.members });
}

// PATCH /api/groups/:groupId/members/:userId  { role }  (owner only)
async function changeMemberRole(req, res) {
  const { role } = req.body || {};
  if (!['organizer', 'member'].includes(role)) {
    return res.status(400).json({ error: 'role must be organizer or member' });
  }

  const member = req.group.members.find((m) => m.user.equals(req.params.userId));
  if (!member) {
    return res.status(404).json({ error: 'That user is not in this group' });
  }
  if (member.role === 'owner') {
    return res.status(400).json({ error: "The owner's role can't be changed" });
  }

  member.role = role;
  await req.group.save();
  res.json({ message: 'Role updated', userId: req.params.userId, role });
}

module.exports = { joinGroup, listMembers, changeMemberRole };
