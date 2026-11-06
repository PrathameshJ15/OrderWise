const app = require('./app');
const { env } = require('./config/env');
const logger = require('./utils/logger');
const { startEmbeddedPostgres } = require('./db/embedded');

async function start() {
  // In development/local mode, ensure embedded postgres is active if postgres is on localhost
  if (
    env.NODE_ENV !== 'production' &&
    (!env.DATABASE_URL || env.DATABASE_URL.includes('localhost') || env.DATABASE_URL.includes('127.0.0.1'))
  ) {
    try {
      await startEmbeddedPostgres();
    } catch (err) {
      logger.warn(`Embedded PostgreSQL startup check: ${err.message}`);
    }
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`OrderWise backend running on http://localhost:${env.PORT}`);
    logger.info(`Environment: ${env.NODE_ENV}`);
    logger.info(`Health check available at http://localhost:${env.PORT}/api/health`);

    // Validate configured Groq model on startup
    try {
      const { validateGroqModel } = require('./services/aiService');
      const modelInfo = validateGroqModel();
      logger.info(`Groq model configured: ${modelInfo.model} (${modelInfo.isKnown ? 'verified' : 'custom'})`);
    } catch (err) {
      logger.warn(`Groq model startup warning: ${err.message}`);
    }
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    logger.info(`${signal} signal received: closing HTTP server`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return server;
}

start().catch((err) => {
  logger.error(`OrderWise backend startup failed: ${err.message}`);
  process.exit(1);
});

module.exports = app;
