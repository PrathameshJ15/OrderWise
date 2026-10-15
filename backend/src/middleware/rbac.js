const { errorResponse } = require('../utils/response');

function rbac(...allowedRoles) {
  const roles = Array.isArray(allowedRoles[0]) ? allowedRoles[0] : allowedRoles.flat();
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 'UNAUTHORIZED', undefined, 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Access denied. Role '${req.user.role}' lacks permission for this action. Requires one of: ${roles.join(', ')}`,
        'FORBIDDEN',
        { allowedRoles: roles, userRole: req.user.role },
        403
      );
    }

    return next();
  };
}

module.exports = rbac;
module.exports.rbac = rbac;
module.exports.authorize = rbac;
