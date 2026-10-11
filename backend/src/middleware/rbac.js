const { errorResponse } = require('../utils/response');

const ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
  INVENTORY_MANAGER: 'inventory_manager',
};

const PERMISSIONS = {
  admin: ['*'],
  inventory_manager: [
    'inventory:read',
    'inventory:write',
    'replenishment:read',
    'products:read',
    'orders:read',
  ],
  customer: ['orders:read_own', 'orders:create', 'products:read'],
};

/**
 * RBAC authorization middleware factory.
 * @param  {...string} allowedRoles - e.g. ('admin', 'inventory_manager') or (['admin'])
 */
function authorize(...allowedRoles) {
  const roles = allowedRoles.flat().map((r) => r.toLowerCase());

  return function (req, res, next) {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 'UNAUTHORIZED', null, 401);
    }

    const userRole = (req.user.role || '').toLowerCase();

    if (!roles.includes(userRole) && !roles.includes('*')) {
      return errorResponse(
        res,
        `Access denied: required role in [${roles.join(', ')}], current role is "${req.user.role}"`,
        'FORBIDDEN',
        { requiredRoles: roles, currentRole: req.user.role },
        403
      );
    }

    next();
  };
}

authorize.authorize = authorize;
authorize.rbac = authorize;
authorize.ROLES = ROLES;
authorize.PERMISSIONS = PERMISSIONS;

module.exports = authorize;
