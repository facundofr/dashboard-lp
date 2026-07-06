const express = require('express');
const prisma = require('../lib/prisma');
const { authMiddleware, checkDisabled } = require('../middleware/auth');
const { logger } = require('../lib/logger');

const router = express.Router();

router.use(authMiddleware, checkDisabled);

router.get('/', async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch (err) {
    logger.error({ err }, 'Error al obtener notificaciones');
    res.status(500).json({ message: 'Error al obtener notificaciones' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, type, link } = req.body;
    if (!title) return res.status(400).json({ message: 'El título es requerido' });
    const notification = await prisma.notification.create({
      data: {
        userId: req.userId,
        title,
        description: description || null,
        type: type || 'info',
        link: link || null,
      },
    });
    res.status(201).json(notification);
  } catch (err) {
    logger.error({ err }, 'Error al crear notificación');
    res.status(500).json({ message: 'Error al crear notificación' });
  }
});

router.put('/read-all', async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.userId, read: false },
      data: { read: true },
    });
    res.json({ message: 'Notificaciones marcadas como leídas' });
  } catch (err) {
    logger.error({ err }, 'Error al marcar notificaciones');
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.delete('/clear', async (req, res) => {
  try {
    await prisma.notification.deleteMany({
      where: { userId: req.userId },
    });
    res.json({ message: 'Notificaciones eliminadas' });
  } catch (err) {
    logger.error({ err }, 'Error al limpiar notificaciones');
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;
