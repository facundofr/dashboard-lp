const express = require('express');
const prisma = require('../lib/prisma');
const { logger } = require('../lib/logger');

const router = express.Router();

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

router.get('/by-slug/:slug', async (req, res) => {
  try {
    const page = await prisma.statusPage.findUnique({
      where: { slug: req.params.slug },
      include: { user: { select: { nombre: true } } },
    });
    if (!page || !page.isPublic) {
      return res.status(404).json({ message: 'Status page no encontrada' });
    }

    const landings = await prisma.landing.findMany({
      where: { userId: page.userId, estado: 'ACTIVO' },
      select: {
        id: true, nombre: true, url: true, categoria: true,
        ultimoStatus: true, ultimoCodigo: true, ultimoMs: true,
        ultimoSslDias: true, ultimoSslVence: true, ultimoCheck: true,
      },
      orderBy: { nombre: 'asc' },
    });

    const stats = {
      total: landings.length,
      up: landings.filter((l) => l.ultimoStatus === 'UP').length,
      down: landings.filter((l) => l.ultimoStatus === 'DOWN').length,
      sinVerificar: landings.filter((l) => !l.ultimoStatus).length,
    };

    res.json({
      page: {
        slug: page.slug,
        title: page.title,
        subtitle: page.subtitle,
        logoUrl: page.logoUrl,
        brandColor: page.brandColor,
        owner: page.user.nombre,
      },
      stats,
      landings,
    });
  } catch (err) {
    logger.error({ err }, 'Error al obtener status page pública');
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/:slug/uptime/:landingId', async (req, res) => {
  try {
    const page = await prisma.statusPage.findUnique({ where: { slug: req.params.slug } });
    if (!page || !page.isPublic) return res.status(404).json({ message: 'Status page no encontrada' });

    const landing = await prisma.landing.findFirst({
      where: { id: parseInt(req.params.landingId), userId: page.userId },
      select: { id: true, nombre: true, url: true },
    });
    if (!landing) return res.status(404).json({ message: 'Landing no encontrada' });

    const logs = await prisma.checkLog.findMany({
      where: { landingId: landing.id },
      orderBy: { createdAt: 'desc' },
      take: 90,
      select: { id: true, isUp: true, statusCode: true, responseMs: true, createdAt: true },
    });

    const uptimePct = logs.length > 0
      ? Math.round((logs.filter((l) => l.isUp).length / logs.length) * 100)
      : null;

    res.json({ landing, logs: [...logs].reverse(), uptimePct });
  } catch (err) {
    logger.error({ err }, 'Error al obtener uptime pública');
    res.status(500).json({ message: 'Error del servidor' });
  }
});

const { authMiddleware, checkDisabled, checkApproved } = require('../middleware/auth');

router.get('/me', authMiddleware, checkDisabled, checkApproved, async (req, res) => {
  try {
    let page = await prisma.statusPage.findUnique({ where: { userId: req.userId } });
    if (!page) {
      const user = await prisma.user.findUnique({ where: { id: req.userId } });
      const baseSlug = slugify(user.nombre || user.email);
      let slug = baseSlug || `user-${req.userId}`;
      const existing = await prisma.statusPage.findUnique({ where: { slug } });
      if (existing) slug = `${slug}-${req.userId}`;
      page = await prisma.statusPage.create({
        data: { userId: req.userId, slug, title: `Estado - ${user.nombre}` },
      });
    }
    res.json(page);
  } catch (err) {
    logger.error({ err }, 'Error al obtener status page propia');
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.put('/me', authMiddleware, checkDisabled, checkApproved, async (req, res) => {
  try {
    const { title, subtitle, logoUrl, brandColor, isPublic } = req.body;
    let page = await prisma.statusPage.findUnique({ where: { userId: req.userId } });
    if (!page) return res.status(404).json({ message: 'Status page no encontrada. Creala primero.' });

    const data = {};
    if (title !== undefined) data.title = title;
    if (subtitle !== undefined) data.subtitle = subtitle;
    if (logoUrl !== undefined) data.logoUrl = logoUrl;
    if (brandColor !== undefined) data.brandColor = brandColor;
    if (isPublic !== undefined) data.isPublic = isPublic;

    page = await prisma.statusPage.update({ where: { userId: req.userId }, data });
    res.json(page);
  } catch (err) {
    logger.error({ err }, 'Error al actualizar status page');
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.put('/me/slug', authMiddleware, checkDisabled, checkApproved, async (req, res) => {
  try {
    const { slug } = req.body;
    if (!slug) return res.status(400).json({ message: 'Slug requerido' });
    const cleanSlug = slugify(slug);
    if (!cleanSlug) return res.status(400).json({ message: 'Slug inválido' });
    const existing = await prisma.statusPage.findUnique({ where: { slug: cleanSlug } });
    if (existing && existing.userId !== req.userId) {
      return res.status(409).json({ message: 'Ese slug ya está en uso' });
    }
    const page = await prisma.statusPage.update({ where: { userId: req.userId }, data: { slug: cleanSlug } });
    res.json(page);
  } catch (err) {
    logger.error({ err }, 'Error al actualizar slug');
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;