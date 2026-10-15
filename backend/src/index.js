const app = require('./app');
const { env } = require('./config/env');
const logger = require('./utils/logger');

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

module.exports = server;
