const pino = require('pino');

const level = process.env.LOG_LEVEL || 'info';

const logger = pino({
  level,
  transport:
    process.env.NODE_ENV === 'production'
      ? undefined
      : {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard' }
        }
});

module.exports = { logger };

