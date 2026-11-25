const mongoose = require('mongoose');
const Group = require('../models/Group');
const { emitToGroup } = require('../socket');

// POST /api/groups
async function createGroup(req, res) {
  const { name, description, userId } = req.body || {};

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Group name is required' });
  }

  const creatorId = req.user?._id || userId;

  const newGroup = new Group({
    name: name.trim(),
    description: description?.trim() || '',
    createdBy: creatorId,
    ...(creatorId ? { members: [{ user: creatorId, role: 'owner' }] } : {}),
  });

  await newGroup.save();
  res.status(201).json({ success: true, data: newGroup });
}

// GET /api/groups
async function getAllGroups(req, res) {
  const groups = await Group.find()
    // .populate('createdBy', 'username email')
    // .populate('members.user', 'username email')
    // .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: groups });
}

// GET /api/groups/:id
async function getGroupById(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, error: 'Invalid group ID' });
  }

  const group = await Group.findById(req.params.id)
    // .populate('createdBy', 'username email')
    // .populate('members.user', 'username email');

  if (!group) {
    return res.status(404).json({ success: false, error: 'Group not found' });
  }

  res.status(200).json({ success: true, data: group });
}

// PATCH /api/groups/:id
async function updateGroup(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, error: 'Invalid group ID' });
  }

  const { name, description } = req.body || {};
  const updates = {};
  if (name !== undefined) updates.name = name.trim();
  if (description !== undefined) updates.description = description.trim();

  const group = await Group.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  })
    // .populate('createdBy', 'username email')
    // .populate('members.user', 'username email');

  if (!group) {
    return res.status(404).json({ success: false, error: 'Group not found' });
  }

  emitToGroup(group._id.toString(), 'group:updated', group);

  res.status(200).json({ success: true, data: group });
}

// DELETE /api/groups/:id
async function deleteGroup(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, error: 'Invalid group ID' });
  }

  const group = await Group.findByIdAndDelete(req.params.id);

  if (!group) {
    return res.status(404).json({ success: false, error: 'Group not found' });
  }

  emitToGroup(group._id.toString(), 'group:deleted', { id: group._id });

  res.status(200).json({ success: true, message: 'Group deleted successfully' });
}

module.exports = {
  createGroup,
  getAllGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
};