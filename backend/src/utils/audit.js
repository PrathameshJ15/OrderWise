const { query } = require('../config/db');
const logger = require('./logger');

/**
 * Log action into audit_logs table.
 */
async function logAuditEvent({
  actorId = null,
  action,
  entityType = 'auth',
  entityId = null,
  beforeState = null,
  afterState = null,
  ipAddress = null,
  userAgent = null,
}) {
  try {
    await query(
      `INSERT INTO audit_logs 
       (actor_id, action, entity_type, entity_id, before_state, after_state, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
      [
        actorId,
        action,
        entityType,
        entityId,
        beforeState ? JSON.stringify(beforeState) : null,
        afterState ? JSON.stringify(afterState) : null,
        ipAddress,
        userAgent,
      ]
    );
  } catch (err) {
    logger.error('Failed to write audit log event', { error: err.message, action });
  }
}

module.exports = { logAuditEvent };
