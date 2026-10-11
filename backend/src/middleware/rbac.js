const { errorResponse } = require('../utils/response');

function rbac(...allowedRoles) {
  const roles = allowedRoles.flat();
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Access denied. Role '${req.user ? req.user.role : 'unauthenticated'}' lacks permission for this action.`,
        'FORBIDDEN',
        { allowedRoles: roles, userRole: req.user ? req.user.role : null },
        403
      );
    }
    return next();
  };
}

module.exports = rbac;
