const Group = require('../models/Group');

/**
 * Authorization: is this user allowed to do this IN THIS GROUP?
 *
 * Like requireRole in Lab 06, but roles are not stored on the user.
 * They are stored per group in Group.members, so we have to load the group
 * and look up the user's role there. Use it after requireAuth:
 *
 *   router.delete('/:groupId', requireAuth, requireGroupRole('owner'), handler)
 *
 * The group id comes from the URL (:groupId or :id).
 * On success it sets req.group (the group document) and req.groupRole.
 *
 * 404 = group doesn't exist
 * 403 = logged in, but not a member or the role isn't allowed
 */
function requireGroupRole(...allowedRoles) {
  return async (req, res, next) => {
    const groupId = req.params.groupId || req.params.id;
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const role = group.getMemberRole(req.user.userId);
    if (!role) {
      return res.status(403).json({ error: 'Forbidden: you are not a member of this group' });
    }
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        error: `Forbidden: requires role ${allowedRoles.join(' or ')}, your role is ${role}`,
      });
    }

    req.group = group;
    req.groupRole = role;
    next();
  };
}

module.exports = { requireGroupRole };
