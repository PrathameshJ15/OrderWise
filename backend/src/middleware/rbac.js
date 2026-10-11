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
 * @param  {...string} roles - e.g. ('admin', 'inventory_manager') or ['admin']
 */
function authorize(...roles) {
  const flattened = roles.flat();
  const normalizedAllowed = flattened.map((r) => String(r).toLowerCase());

  return function (req, res, next) {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 'UNAUTHORIZED', null, 401);
    }

    const userRole = (req.user.role || '').toLowerCase();

    if (!normalizedAllowed.includes(userRole) && !normalizedAllowed.includes('*')) {
      return errorResponse(
        res,
        `Access denied. Role '${req.user ? req.user.role : 'unauthenticated'}' lacks permission for this action.`,
        'FORBIDDEN',
        { requiredRoles: flattened, currentRole: req.user.role },
        403
      );
    }

    next();
  };
}

module.exports = authorize;
module.exports.authorize = authorize;
module.exports.rbac = authorize;
module.exports.ROLES = ROLES;
module.exports.PERMISSIONS = PERMISSIONS;
