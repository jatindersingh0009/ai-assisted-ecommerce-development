const logger = require('../config/logger');
const { sendError } = require('../utils/response');

const notFound = (req, res) => {
  return sendError(res, 404, `Route not found: ${req.originalUrl}`);
};

const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  return sendError(res, statusCode, message);
};

module.exports = {
  notFound,
  errorHandler,
};
