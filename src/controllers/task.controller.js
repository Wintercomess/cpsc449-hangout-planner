const Task = require('../models/Task');
const { emitToGroup } = require('../socket');

// POST /api/groups/:id/tasks
async function createTask(req, res) {
  const { id: groupId } = req.params;
  const { title, description } = req.body || {};

  if (!title?.trim()) {
    return res.status(400).json({ success: false, error: 'Task title is required' });
  }

  const task = await Task.create({
    group: groupId,
    title: title.trim(),
    description: description?.trim() || '',
  });

  const tasks = await Task.find({ group: groupId }).sort({ createdAt: -1 });
  emitToGroup(groupId, 'tasks:updated', tasks);

  res.status(201).json({ success: true, data: task });
}

// GET /api/groups/:id/tasks
async function getTasks(req, res) {
  const tasks = await Task.find({ group: req.params.id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: tasks });
}

// PATCH /api/groups/:id/tasks/:taskId
async function updateTask(req, res) {
  const { id: groupId, taskId } = req.params;
  const { title, description, assignedTo, status } = req.body || {};

  const updates = {};
  if (title !== undefined) updates.title = title.trim();
  if (description !== undefined) updates.description = description.trim();
  if (assignedTo !== undefined) updates.assignedTo = assignedTo;
  if (status !== undefined) updates.status = status;

  const task = await Task.findOneAndUpdate(
    { _id: taskId, group: groupId },
    updates,
    { new: true, runValidators: true }
  );

  if (!task) {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }

  const tasks = await Task.find({ group: groupId }).sort({ createdAt: -1 });
  emitToGroup(groupId, 'tasks:updated', tasks);

  res.status(200).json({ success: true, data: task });
}

// DELETE /api/groups/:id/tasks/:taskId
async function deleteTask(req, res) {
  const { id: groupId, taskId } = req.params;
  const task = await Task.findOneAndDelete({ _id: taskId, group: groupId });

  if (!task) {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }

  const tasks = await Task.find({ group: groupId }).sort({ createdAt: -1 });
  emitToGroup(groupId, 'tasks:updated', tasks);

  res.status(200).json({ success: true, message: 'Task deleted' });
}

module.exports = { createTask, getTasks, updateTask, deleteTask };