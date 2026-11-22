const Group = require('../models/Group');

// POST /groups
async function createGroup(req, res) {
  const { name, description, userId } = req.body;

  const newGroup = new Group({
    name,
    description,
    createdBy: userId,
  });

  await newGroup.save(); 
  res.status(201).json({ success: true, data: newGroup });
}

// GET /groups/:id
async function getGroupById(req, res) {
  const group = await Group.findById(req.params.id)
    .populate('createdBy', 'username email')
    .populate('members.user', 'username email');

  if (!group) {
    return res.status(404).json({ success: false, error: 'Group not found' });
  }

  res.status(200).json({ success: true, data: group });
}

module.exports = { 
  createGroup, 
  getGroupById 
};