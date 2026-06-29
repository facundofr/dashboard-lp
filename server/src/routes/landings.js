const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const landings = await prisma.landing.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
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
    });
    if (!landing) return res.status(404).json({ message: 'Landing no encontrada' });
    res.json(landing);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener landing' });
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

module.exports = router;
