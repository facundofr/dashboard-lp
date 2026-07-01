const express = require('express');
const prisma = require('../lib/prisma');
const { logger } = require('../lib/logger');

const router = express.Router();

router.get('/', async (req, res) => {
  const health = { status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() };

  try {
    await prisma.$queryRaw`SELECT 1`;
    health.database = 'connected';
  } catch (err) {
    health.status = 'degraded';
    health.database = 'disconnected';
    logger.error({ err: err.message }, 'Health check - database error');
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

module.exports = router;