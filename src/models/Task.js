const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: ['open', 'claimed', 'done'], default: 'open' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);