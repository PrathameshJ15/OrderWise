const { errorResponse } = require('../utils/response');

function rbac(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 'UNAUTHORIZED', undefined, 401);
    }

    const roles = Array.isArray(allowedRoles[0]) ? allowedRoles[0] : allowedRoles;

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Access denied. Requires one of: ${roles.join(', ')}`,
        'FORBIDDEN',
        undefined,
        403
      );
    }

    return next();
  };
}

module.exports = { rbac };
