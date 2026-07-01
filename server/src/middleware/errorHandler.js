const { logger } = require('../lib/logger');

function errorHandler(err, req, res, next) {
  logger.error({ err, path: req.path, method: req.method }, 'Error no manejado');

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({ message: 'El registro ya existe' });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Error interno del servidor',
  });
}

module.exports = errorHandler;