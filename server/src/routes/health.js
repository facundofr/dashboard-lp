const express = require('express');
const os = require('os');
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

  health.memory = {
    free: os.freemem(),
    total: os.totalmem(),
    usagePct: Math.round((1 - os.freemem() / os.totalmem()) * 100),
  };
  health.loadAvg = os.loadavg();
  health.platform = os.platform();
  health.hostname = os.hostname();

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

module.exports = router;