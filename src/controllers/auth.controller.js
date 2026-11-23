const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const SALT_ROUNDS = 10;

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

// Only what the app needs goes in the token, never the password or hash
function signToken(user) {
  return jwt.sign(
    { userId: user._id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
  );
}

// POST /api/auth/register  { name, email, password }
async function register(req, res) {
  const { name, email, password } = req.body || {};
  if (typeof password !== 'string' || password.length < 6) {
    throw badRequest('password must be at least 6 characters');
  }

  // Only the bcrypt hash is stored. Name/email are checked by the User model,
  // and a duplicate email becomes a 409 in errorHandler.
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ name, email, passwordHash });

  res.status(201).json({ token: signToken(user), user });
}

// POST /api/auth/login  { email, password }
async function login(req, res) {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    throw badRequest('email and password are required');
  }

  // passwordHash has select:false in the model, so ask for it explicitly
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');

  // Same message for wrong email and wrong password
  const match = user && user.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!match) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  res.json({ token: signToken(user), user });
}

// GET /api/auth/me  (needs a token) -> the logged-in user
async function me(req, res) {
  const user = await User.findById(req.user.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user });
}

module.exports = { register, login, me };
