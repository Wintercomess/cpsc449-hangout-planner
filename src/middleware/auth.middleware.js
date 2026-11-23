const jwt = require('jsonwebtoken');

/**
 * Authentication: who is this user?
 * Same idea as verifyToken in Lab 06. Reads "Authorization: Bearer <token>",
 * checks the signature with JWT_SECRET, and puts the payload on req.user
 * ({ userId, email, name }).
 *
 * 401 = not logged in (no token, bad token, or expired token)
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: no token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth };
