const { errorResponse } = require('../utils/response');

/**
 * Ensures customer users cannot access resources belonging to another customer.
 * Admins and inventory managers bypass this check.
 * 
 * @param {Function|string} extractor - Either a param name (e.g. 'customerId') or a function (req) => customerId
 */
function checkOwnership(extractor = 'customerId') {
  return function (req, res, next) {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 'UNAUTHORIZED', null, 401);
    }

    // Admins and inventory managers have elevated viewing rights
    if (req.user.role === 'admin' || req.user.role === 'inventory_manager') {
      return next();
    }

    let targetCustomerId;
    if (typeof extractor === 'function') {
      targetCustomerId = extractor(req);
    } else {
      targetCustomerId = req.params[extractor] || req.query[extractor] || req.body[extractor];
    }

    if (!targetCustomerId) {
      return next();
    }

    // Compare numeric or string IDs
    if (String(targetCustomerId) !== String(req.user.userId)) {
      return errorResponse(
        res,
        'Access denied: you can only access your own customer resources',
        'FORBIDDEN',
        { requestedCustomerId: targetCustomerId, currentUserId: req.user.userId },
        403
      );
    }

    next();
  };
}

module.exports = { checkOwnership };
