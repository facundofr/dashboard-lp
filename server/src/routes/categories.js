const express = require('express');
const prisma = require('../lib/prisma');
const { authMiddleware, checkDisabled, checkApproved, adminMiddleware } = require('../middleware/auth');
const { logger } = require('../lib/logger');

const router = express.Router();
router.use(authMiddleware, checkDisabled, checkApproved);

router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    res.json(categories);
  } catch (err) {
    logger.error({ err }, 'Error al obtener categorías');
    res.status(500).json({ message: 'Error al obtener categorías' });
  }
});

router.post('/', adminMiddleware, async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'El nombre es requerido' });
    const existing = await prisma.category.findUnique({ where: { name: name.trim() } });
    if (existing) return res.status(409).json({ message: 'Ya existe una categoría con ese nombre' });
    const category = await prisma.category.create({
      data: { name: name.trim(), color: color || undefined },
    });
    res.status(201).json(category);
  } catch (err) {
    logger.error({ err }, 'Error al crear categoría');
    res.status(500).json({ message: 'Error al crear categoría' });
  }
});

router.put('/:id', adminMiddleware, async (req, res) => {
  try {
    const { name, color } = req.body;
    const data = {};
    if (name) data.name = name.trim();
    if (color) data.color = color;
    const category = await prisma.category.update({
      where: { id: parseInt(req.params.id) },
      data,
    });
    res.json(category);
  } catch (err) {
    logger.error({ err }, 'Error al actualizar categoría');
    res.status(500).json({ message: 'Error al actualizar categoría' });
  }
});

router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Categoría eliminada' });
  } catch (err) {
    logger.error({ err }, 'Error al eliminar categoría');
    res.status(500).json({ message: 'Error al eliminar categoría' });
  }
});

module.exports = router;
