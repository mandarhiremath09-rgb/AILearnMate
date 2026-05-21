const { logger } = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(err.message, err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (err.name === 'ForbiddenError') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
};

module.exports = { errorHandler };
