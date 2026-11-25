const mongoose = require('mongoose');

const ideaSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    category: { type: String, enum: ['location', 'date', 'time'], required: true },
    value: { type: String, required: true, trim: true },
    proposedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isFinalized: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Idea', ideaSchema);