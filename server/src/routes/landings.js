const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { checkUrl, checkSsl } = require('../lib/checker');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const landings = await prisma.landing.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { logs: true } } },
    });
    res.json(landings);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener landings' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const landing = await prisma.landing.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId },
      include: { logs: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!landing) return res.status(404).json({ message: 'Landing no encontrada' });
    res.json(landing);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener landing' });
  }
});

router.get('/:id/logs', async (req, res) => {
  try {
    const landing = await prisma.landing.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId },
    });
    if (!landing) return res.status(404).json({ message: 'Landing no encontrada' });
    const logs = await prisma.checkLog.findMany({
      where: { landingId: landing.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener logs' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nombre, marca, url, estado, categoria, ftpHost, ftpUser, ftpPass, ftpPath, tecnologias, notas, imagenUrl, sheetUrl, formStatus } = req.body;
    const landing = await prisma.landing.create({
      data: {
        nombre, marca, url, estado: estado || 'ACTIVO', categoria: categoria || 'Cober',
        ftpHost, ftpUser, ftpPass, ftpPath, tecnologias, notas, imagenUrl, sheetUrl, formStatus,
        userId: req.userId,
      },
    });
    res.status(201).json(landing);
  } catch (err) {
    res.status(500).json({ message: 'Error al crear landing' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await prisma.landing.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId },
    });
    if (!existing) return res.status(404).json({ message: 'Landing no encontrada' });

    const { nombre, marca, url, estado, categoria, ftpHost, ftpUser, ftpPass, ftpPath, tecnologias, notas, imagenUrl, sheetUrl, formStatus } = req.body;
    const landing = await prisma.landing.update({
      where: { id: parseInt(req.params.id) },
      data: { nombre, marca, url, estado, categoria, ftpHost, ftpUser, ftpPass, ftpPath, tecnologias, notas, imagenUrl, sheetUrl, formStatus },
    });
    res.json(landing);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar landing' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.landing.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId },
    });
    if (!existing) return res.status(404).json({ message: 'Landing no encontrada' });

    await prisma.landing.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Landing eliminada' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar landing' });
  }
});

router.post('/:id/check', async (req, res) => {
  try {
    const landing = await prisma.landing.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId },
    });
    if (!landing) return res.status(404).json({ message: 'Landing no encontrada' });

    const parsed = new URL(landing.url);
    const [urlResult, sslResult] = await Promise.all([
      checkUrl(landing.url),
      parsed.protocol === 'https:' ? checkSsl(parsed.hostname) : { valid: null, daysRemaining: null, error: 'No HTTPS' },
    ]);

    const log = await prisma.checkLog.create({
      data: {
        landingId: landing.id,
        statusCode: urlResult.statusCode,
        responseMs: urlResult.responseMs,
        isUp: urlResult.isUp,
        error: urlResult.error,
      },
    });

    await prisma.landing.update({
      where: { id: landing.id },
      data: {
        ultimoCheck: new Date(),
        ultimoStatus: urlResult.isUp ? 'UP' : 'DOWN',
        ultimoCodigo: urlResult.statusCode,
        ultimoMs: urlResult.responseMs,
      },
    });

    res.json({ url: urlResult, ssl: sslResult, log });
  } catch (err) {
    res.status(500).json({ message: 'Error al verificar landing' });
  }
});

router.post('/check-all', async (req, res) => {
  try {
    const landings = await prisma.landing.findMany({ where: { userId: req.userId } });
    const results = [];
    for (const landing of landings) {
      try {
        const parsed = new URL(landing.url);
        const urlResult = await checkUrl(landing.url);
        await prisma.checkLog.create({
          data: { landingId: landing.id, statusCode: urlResult.statusCode, responseMs: urlResult.responseMs, isUp: urlResult.isUp, error: urlResult.error },
        });
        await prisma.landing.update({
          where: { id: landing.id },
          data: { ultimoCheck: new Date(), ultimoStatus: urlResult.isUp ? 'UP' : 'DOWN', ultimoCodigo: urlResult.statusCode, ultimoMs: urlResult.responseMs },
        });
        results.push({ id: landing.id, url: landing.url, isUp: urlResult.isUp });
      } catch {
        results.push({ id: landing.id, url: landing.url, isUp: false });
      }
    }
    res.json({ checked: results.length, results });
  } catch (err) {
    res.status(500).json({ message: 'Error al verificar todas' });
  }
});

module.exports = router;
