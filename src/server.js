const http = require('http');
const app = require('./app');
const { connectMongo, disconnectMongo } = require('./utils/mongo');
const { logger } = require('./utils/logger');

const PORT = process.env.PORT || 3000;

async function start() {
  await connectMongo();

  const server = http.createServer(app);

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error({ port: PORT, err }, `Port ${PORT} already in use`);
      process.exit(1);
    }
    logger.error({ err }, 'Server error');
    process.exit(1);
  });

  server.listen(PORT, () => {
    logger.info({ port: PORT }, 'Server listening');
  });

  const shutdown = async (signal) => {
    logger.info({ signal }, 'Shutting down');
    server.close(() => {
      // allow inflight requests to finish
    });
    try {
      await disconnectMongo();
    } finally {
      process.exit(0);
    }
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  logger.error({ err }, 'Fatal startup error');
  process.exitCode = 1;
});


