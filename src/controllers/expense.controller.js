const Expense = require('../models/Expense');
const Group = require('../models/Group');
const { emitToGroup } = require('../socket');

async function getExpensesSummary(groupId) {
  const [expenses, group] = await Promise.all([
    Expense.find({ group: groupId }).sort({ createdAt: -1 }),
    Group.findById(groupId),
  ]);

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const memberCount = Math.max(group?.members?.length || 1, 1);
  const perPersonSplit = Number((total / memberCount).toFixed(2));

  return { expenses, total: Number(total.toFixed(2)), memberCount, perPersonSplit };
}

// POST /api/groups/:id/expenses
async function createExpense(req, res) {
  const { id: groupId } = req.params;
  const { title, amount, userId } = req.body || {};

  if (!title?.trim() || amount === undefined || Number(amount) < 0) {
    return res.status(400).json({ success: false, error: 'Valid title and amount are required' });
  }

  const expense = await Expense.create({
    group: groupId,
    title: title.trim(),
    amount: Number(amount),
    paidBy: req.user?._id || userId,
  });

  const summary = await getExpensesSummary(groupId);
  emitToGroup(groupId, 'expenses:updated', summary);

  res.status(201).json({ success: true, data: expense });
}

// GET /api/groups/:id/expenses
async function getExpenses(req, res) {
  const summary = await getExpensesSummary(req.params.id);
  res.status(200).json({ success: true, data: summary });
}

// PATCH /api/groups/:id/expenses/:expenseId
async function updateExpense(req, res) {
  const { id: groupId, expenseId } = req.params;
  const { title, amount } = req.body || {};

  const updates = {};
  if (title !== undefined) updates.title = title.trim();
  if (amount !== undefined) updates.amount = Number(amount);

  const expense = await Expense.findOneAndUpdate(
    { _id: expenseId, group: groupId },
    updates,
    { new: true, runValidators: true }
  );

  if (!expense) {
    return res.status(404).json({ success: false, error: 'Expense not found' });
  }

  const summary = await getExpensesSummary(groupId);
  emitToGroup(groupId, 'expenses:updated', summary);

  res.status(200).json({ success: true, data: expense });
}

// DELETE /api/groups/:id/expenses/:expenseId
async function deleteExpense(req, res) {
  const { id: groupId, expenseId } = req.params;
  const expense = await Expense.findOneAndDelete({ _id: expenseId, group: groupId });

  if (!expense) {
    return res.status(404).json({ success: false, error: 'Expense not found' });
  }

  const summary = await getExpensesSummary(groupId);
  emitToGroup(groupId, 'expenses:updated', summary);

  res.status(200).json({ success: true, message: 'Expense deleted' });
}

module.exports = { createExpense, getExpenses, updateExpense, deleteExpense };