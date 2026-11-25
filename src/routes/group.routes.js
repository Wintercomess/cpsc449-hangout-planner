const express = require('express');
const router = express.Router();
const groupcontroller = require('../controllers/groupcontroller');
const votingController = require('../controllers/voting.controller');
const taskController = require('../controllers/task.controller');
const expenseController = require('../controllers/expense.controller');

// Group CRUD
router.post('/', groupcontroller.createGroup);
router.get('/', groupcontroller.getAllGroups);
router.get('/:id', groupcontroller.getGroupById);
router.patch('/:id', groupcontroller.updateGroup);
router.delete('/:id', groupcontroller.deleteGroup);

// Voting
router.post('/:id/ideas', votingController.createIdea);
router.get('/:id/ideas', votingController.getIdeas);
router.post('/:id/vote', votingController.castVote);
router.post('/:id/finalize', votingController.finalizePlan);

// Tasks
router.post('/:id/tasks', taskController.createTask);
router.get('/:id/tasks', taskController.getTasks);
router.patch('/:id/tasks/:taskId', taskController.updateTask);
router.delete('/:id/tasks/:taskId', taskController.deleteTask);

// Expenses
router.post('/:id/expenses', expenseController.createExpense);
router.get('/:id/expenses', expenseController.getExpenses);
router.patch('/:id/expenses/:expenseId', expenseController.updateExpense);
router.delete('/:id/expenses/:expenseId', expenseController.deleteExpense);

module.exports = router;