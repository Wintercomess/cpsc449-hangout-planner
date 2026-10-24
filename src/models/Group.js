const crypto = require('crypto');
const mongoose = require('mongoose');

const ROLES = ['owner', 'organizer', 'member'];

// 8-character code people use to join a group, e.g. "4F9A1C2B"
function generateInviteCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'member.user is required'],
    },
    // Permission role inside THIS group
    //   owner:     created the group, manages members and roles, can delete it
    //   organizer: creates hangouts, finalizes votes, assigns tasks
    //   member:    suggests options, votes, claims tasks, adds expenses
    role: {
      type: String,
      enum: { values: ROLES, message: 'role must be one of: ' + ROLES.join(', ') },
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'name is required'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    inviteCode: {
      type: String,
      unique: true,
      default: generateInviteCode,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'createdBy is required'],
    },
    members: {
      type: [memberSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Fast lookup of "which groups is this user in?"
groupSchema.index({ 'members.user': 1 });

// When a group is created, make sure its creator is in it as the owner.
groupSchema.pre('validate', function addCreatorAsOwner() {
  if (!this.isNew || !this.createdBy) return;
  const creator = this.members.find((m) => m.user && m.user.equals(this.createdBy));
  if (creator) {
    creator.role = 'owner';
  } else {
    this.members.unshift({ user: this.createdBy, role: 'owner' });
  }
});

// Role of a user in this group, or null if they aren't a member.
// Handy for the role-check middleware later.
groupSchema.methods.getMemberRole = function getMemberRole(userId) {
  const member = this.members.find((m) => m.user && m.user.equals(userId));
  return member ? member.role : null;
};

groupSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;
module.exports.ROLES = ROLES;
