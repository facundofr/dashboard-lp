const express = require('express');
const prisma = require('../lib/prisma');
const { apiKeyMiddleware } = require('../middleware/auth');
const { logger } = require('../lib/logger');

const router = express.Router();

router.use(apiKeyMiddleware);

router.get('/landings', async (req, res) => {
  try {
    const landings = await prisma.landing.findMany({
      where: { userId: req.userId },
      select: {
        id: true, nombre: true, marca: true, url: true, estado: true, categoria: true,
        ultimoStatus: true, ultimoCodigo: true, ultimoMs: true,
        ultimoSslValido: true, ultimoSslDias: true, ultimoSslVence: true,
        ultimoCheck: true, tags: true, cliente: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: landings, count: landings.length });
  } catch (err) {
    logger.error({ err }, 'Error API pública landings');
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/landings/:id', async (req, res) => {
  try {
    const landing = await prisma.landing.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId },
      select: {
        id: true, nombre: true, marca: true, url: true, estado: true, categoria: true,
        ultimoStatus: true, ultimoCodigo: true, ultimoMs: true,
        ultimoSslValido: true, ultimoSslDias: true, ultimoSslVence: true,
        ultimoCheck: true, tags: true, cliente: true, tecnologias: true, createdAt: true,
      },
    });
    if (!landing) return res.status(404).json({ message: 'Landing no encontrada' });
    res.json(landing);
  } catch (err) {
    logger.error({ err }, 'Error API pública landing');
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/landings/:id/logs', async (req, res) => {
  try {
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const landing = await prisma.landing.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId },
      select: { id: true },
    });
    if (!landing) return res.status(404).json({ message: 'Landing no encontrada' });
    const logs = await prisma.checkLog.findMany({
      where: { landingId: landing.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    res.json({ data: logs, count: logs.length });
  } catch (err) {
    logger.error({ err }, 'Error API pública logs');
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/landings/:id/uptime', async (req, res) => {
  try {
    const landing = await prisma.landing.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId },
      select: { id: true },
    });
    if (!landing) return res.status(404).json({ message: 'Landing no encontrada' });
    const days = Math.min(90, parseInt(req.query.days) || 30);
    const since = new Date(Date.now() - days * 86400000);
    const logs = await prisma.checkLog.findMany({
      where: { landingId: landing.id, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
      select: { isUp: true, responseMs: true, statusCode: true, createdAt: true },
    });
    const upCount = logs.filter((l) => l.isUp).length;
    const uptimePct = logs.length > 0 ? Math.round((upCount / logs.length) * 100) : null;
    const avgResponseMs = logs.length > 0
      ? Math.round(logs.reduce((sum, l) => sum + (l.responseMs || 0), 0) / logs.length)
      : null;
    res.json({ uptimePct, totalChecks: logs.length, upChecks: upCount, avgResponseMs, logs });
  } catch (err) {
    logger.error({ err }, 'Error API pública uptime');
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const [total, up, down, sinVerificar] = await Promise.all([
      prisma.landing.count({ where: { userId: req.userId } }),
      prisma.landing.count({ where: { userId: req.userId, ultimoStatus: 'UP' } }),
      prisma.landing.count({ where: { userId: req.userId, ultimoStatus: 'DOWN' } }),
      prisma.landing.count({ where: { userId: req.userId, ultimoStatus: null } }),
    ]);
    res.json({ total, up, down, sinVerificar });
  } catch (err) {
    logger.error({ err }, 'Error API pública stats');
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;