const express = require('express');
const prisma = require('../lib/prisma');
const { authMiddleware, checkDisabled } = require('../middleware/auth');
const { logger } = require('../lib/logger');

const router = express.Router();
router.use(authMiddleware, checkDisabled);

router.get('/', async (req, res) => {
  try {
    const incidents = await prisma.incident.findMany({
      where: {
        landing: { userId: req.userId },
        recoveredAt: null,
      },
      include: { landing: { select: { id: true, nombre: true, marca: true, url: true } } },
      orderBy: { startedAt: 'desc' },
    });
    res.json(incidents);
  } catch (err) {
    logger.error({ err }, 'Error al obtener incidentes activos');
    res.status(500).json({ message: 'Error al obtener incidentes' });
  }
});

router.get('/history', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where: {
          landing: { userId: req.userId },
          recoveredAt: { not: null },
        },
        include: { landing: { select: { id: true, nombre: true, marca: true, url: true } } },
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.incident.count({
        where: {
          landing: { userId: req.userId },
          recoveredAt: { not: null },
        },
      }),
    ]);
    res.json({
      data: incidents,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    logger.error({ err }, 'Error al obtener historial de incidentes');
    res.status(500).json({ message: 'Error al obtener historial' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const incident = await prisma.incident.findFirst({
      where: { id: parseInt(req.params.id), landing: { userId: req.userId } },
      include: {
        landing: {
          select: { id: true, nombre: true, marca: true, url: true, ultimoStatus: true },
        },
      },
    });
    if (!incident) return res.status(404).json({ message: 'Incidente no encontrado' });
    res.json(incident);
  } catch (err) {
    logger.error({ err }, 'Error al obtener incidente');
    res.status(500).json({ message: 'Error al obtener incidente' });
  }
});

router.put('/:id/acknowledge', async (req, res) => {
  try {
    const incident = await prisma.incident.findFirst({
      where: { id: parseInt(req.params.id), landing: { userId: req.userId } },
    });
    if (!incident) return res.status(404).json({ message: 'Incidente no encontrado' });
    const updated = await prisma.incident.update({
      where: { id: incident.id },
      data: { acknowledgedAt: new Date() },
    });
    res.json(updated);
  } catch (err) {
    logger.error({ err }, 'Error al acknowledge incidente');
    res.status(500).json({ message: 'Error al acknowledge' });
  }
});

module.exports = router;
