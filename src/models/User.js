const mongoose = require('mongoose');

/**
 * A user account. Permission roles (owner / organizer / member) are NOT
 * stored here — they belong to a user's membership in a specific group
 * (see Group.members), so someone can be an owner in one group and a
 * member in another.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'name is required'],
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: [true, 'email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'email is not valid'],
    },
    // bcrypt hash, never the plain password. Optional because users who
    // sign in with Google won't have one. select:false keeps it out of
    // query results unless explicitly requested with .select('+passwordHash').
    passwordHash: {
      type: String,
      select: false,
    },
    // Google account id, for Google sign-in / Calendar later
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

// Never send the password hash back in API responses
userSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
