const { AppError } = require('../utils/response');

/**
 * Order State Machine for OrderWise.
 * Defines all allowable lifecycle transitions.
 */
const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  ALLOCATED: 'allocated',
  PARTIALLY_ALLOCATED: 'partially_allocated',
  SHIPPED: 'shipped',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const ALLOWED_TRANSITIONS = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [
    ORDER_STATUS.ALLOCATED,
    ORDER_STATUS.PARTIALLY_ALLOCATED,
    ORDER_STATUS.CANCELLED,
  ],
  [ORDER_STATUS.ALLOCATED]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PARTIALLY_ALLOCATED]: [
    ORDER_STATUS.ALLOCATED,
    ORDER_STATUS.SHIPPED,
    ORDER_STATUS.CANCELLED,
  ],
  [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.COMPLETED],
  [ORDER_STATUS.COMPLETED]: [], // Terminal state
  [ORDER_STATUS.CANCELLED]: [], // Terminal state
};

/**
 * Validates whether transitioning an order from currentStatus to nextStatus is allowed.
 * Throws AppError with ILLEGAL_STATE_TRANSITION code if invalid.
 */
function validateTransition(currentStatus, nextStatus) {
  if (currentStatus === nextStatus) {
    return true;
  }

  const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(nextStatus)) {
    throw new AppError(
      `Illegal order state transition: cannot transition order from "${currentStatus}" to "${nextStatus}". Allowed target states: [${allowedNext.join(', ')}]`,
      'ILLEGAL_STATE_TRANSITION',
      400,
      { currentStatus, nextStatus, allowedTransitions: allowedNext }
    );
  }

  return true;
}

module.exports = {
  ORDER_STATUS,
  ALLOWED_TRANSITIONS,
  validateTransition,
};
