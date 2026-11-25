const Idea = require('../models/Idea');
const { emitToGroup } = require('../socket');

async function getFormattedIdeas(groupId) {
  const ideas = await Idea.find({ group: groupId }).sort({ createdAt: -1 }).lean();
  return ideas.map((idea) => ({ ...idea, voteCount: idea.votes.length }));
}

// POST /api/groups/:id/ideas
async function createIdea(req, res) {
  const { id: groupId } = req.params;
  const { category, value, userId } = req.body || {};

  if (!category || !value?.trim()) {
    return res.status(400).json({ success: false, error: 'category and value are required' });
  }

  const idea = await Idea.create({
    group: groupId,
    category,
    value: value.trim(),
    proposedBy: req.user?._id || userId,
  });

  const ideas = await getFormattedIdeas(groupId);
  emitToGroup(groupId, 'votes:updated', ideas);

  res.status(201).json({ success: true, data: idea });
}

// GET /api/groups/:id/ideas
async function getIdeas(req, res) {
  const ideas = await getFormattedIdeas(req.params.id);
  res.status(200).json({ success: true, data: ideas });
}

// POST /api/groups/:id/vote
async function castVote(req, res) {
  const { id: groupId } = req.params;
  const { ideaId, userId } = req.body || {};
  const voterId = req.user?._id || userId;

  if (!ideaId || !voterId) {
    return res.status(400).json({ success: false, error: 'ideaId and userId are required' });
  }

  const targetIdea = await Idea.findOne({ _id: ideaId, group: groupId });
  if (!targetIdea) {
    return res.status(404).json({ success: false, error: 'Idea not found' });
  }

  // Remove voter's previous vote in the same category so they can switch votes cleanly
  await Idea.updateMany(
    { group: groupId, category: targetIdea.category },
    { $pull: { votes: voterId } }
  );

  // Add vote to the selected idea
  await Idea.findByIdAndUpdate(ideaId, { $addToSet: { votes: voterId } });

  const ideas = await getFormattedIdeas(groupId);
  emitToGroup(groupId, 'votes:updated', ideas);

  res.status(200).json({ success: true, data: ideas });
}

// POST /api/groups/:id/finalize
async function finalizePlan(req, res) {
  const { id: groupId } = req.params;
  const ideas = await Idea.find({ group: groupId });

  const winners = {};
  for (const category of ['location', 'date', 'time']) {
    const inCategory = ideas.filter((i) => i.category === category);
    if (inCategory.length > 0) {
      inCategory.sort((a, b) => b.votes.length - a.votes.length);
      winners[category] = inCategory[0];
    }
  }

  const winnerIds = Object.values(winners).map((w) => w._id);
  await Idea.updateMany({ group: groupId }, { isFinalized: false });
  await Idea.updateMany({ _id: { $in: winnerIds } }, { isFinalized: true });

  emitToGroup(groupId, 'plan:finalized', winners);

  res.status(200).json({ success: true, data: winners });
}

module.exports = { createIdea, getIdeas, castVote, finalizePlan };