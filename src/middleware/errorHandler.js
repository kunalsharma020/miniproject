const { logger } = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error({ err }, 'Unhandled error');

  if (res.headersSent) return next(err);

  // Express JSON body parser error (invalid JSON)
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'invalid_json',
      message: 'Request body contains invalid JSON'
    });
  }

  const status = err.statusCode || 500;
  res.status(status).json({
    error: err.code || 'internal_error',
    message: err.message || 'Internal server error',
    details: err.details
  });
}

module.exports = { errorHandler };

