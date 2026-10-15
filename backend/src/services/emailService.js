const logger = require('../utils/logger');
const { env } = require('../config/env');

/**
 * Optional email stub (log-only, no real sending) behind a feature flag.
 * Feature flag: ENABLE_EMAIL_NOTIFICATIONS (default true in development for visibility)
 */
class EmailStubService {
  constructor() {
    this.enabled = process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true' || env.NODE_ENV === 'development';
  }

  /**
   * Logs an email delivery attempt without contacting any SMTP server.
   * @param {Object} options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.body - Email plain text / summary
   * @param {Object} [options.metadata] - Extra metadata (orderId, runId, etc.)
   */
  async sendEmail({ to, subject, body, metadata = {} }) {
    if (!this.enabled) {
      return { sent: false, reason: 'feature_flag_disabled' };
    }

    const payload = {
      timestamp: new Date().toISOString(),
      to,
      subject,
      body,
      metadata,
    };

    logger.info(`[EMAIL_STUB] Simulated dispatch to ${to}: "${subject}" | Details: ${JSON.stringify(metadata)}`);
    return { sent: true, stub: true, details: payload };
  }
}

module.exports = new EmailStubService();
