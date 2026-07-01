const express = require('express');
const prisma = require('../lib/prisma');
const { authMiddleware } = require('../middleware/auth');
const { logger } = require('../lib/logger');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const configs = await prisma.webhookConfig.findMany({ where: { userId: req.userId } });
    res.json(configs);
  } catch (err) {
    logger.error({ err }, 'Error al obtener webhooks');
    res.status(500).json({ message: 'Error al obtener webhooks' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { url, events, secret } = req.body;
    if (!url) return res.status(400).json({ message: 'URL requerida' });
    const config = await prisma.webhookConfig.create({
      data: { userId: req.userId, url, events: events || 'down,ssl_expiring', secret },
    });
    res.status(201).json(config);
  } catch (err) {
    logger.error({ err }, 'Error al crear webhook');
    res.status(500).json({ message: 'Error al crear webhook' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await prisma.webhookConfig.findFirst({ where: { id: parseInt(req.params.id), userId: req.userId } });
    if (!existing) return res.status(404).json({ message: 'Webhook no encontrado' });
    const { url, events, enabled, secret } = req.body;
    const config = await prisma.webhookConfig.update({
      where: { id: existing.id },
      data: { url, events, enabled, secret },
    });
    res.json(config);
  } catch (err) {
    logger.error({ err }, 'Error al actualizar webhook');
    res.status(500).json({ message: 'Error al actualizar webhook' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.webhookConfig.findFirst({ where: { id: parseInt(req.params.id), userId: req.userId } });
    if (!existing) return res.status(404).json({ message: 'Webhook no encontrado' });
    await prisma.webhookConfig.delete({ where: { id: existing.id } });
    res.json({ message: 'Webhook eliminado' });
  } catch (err) {
    logger.error({ err }, 'Error al eliminar webhook');
    res.status(500).json({ message: 'Error al eliminar webhook' });
  }
});

router.post('/test', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL requerida' });
    const { sendWebhook } = require('../lib/webhook');
    const result = await sendWebhook({ url, secret: null, id: 'test' }, { event: 'test', message: 'Prueba de webhook desde Gestor Landings', timestamp: new Date().toISOString() });
    res.json(result);
  } catch (err) {
    logger.error({ err }, 'Error al probar webhook');
    res.status(500).json({ message: 'Error al probar webhook' });
  }
});

module.exports = router;