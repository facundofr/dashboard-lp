const express = require('express');
const prisma = require('../lib/prisma');
const { authMiddleware, checkDisabled, checkApproved } = require('../middleware/auth');
const { checkUrl, checkSsl, scanMetaTags } = require('../lib/checker');
const { logAudit } = require('../lib/audit');
const { processCheckResult } = require('../lib/incidentHelper');
const { encrypt } = require('../lib/ftpEncrypt');
const { landingValidation } = require('../middleware/validator');
const { logger } = require('../lib/logger');

const router = express.Router();

router.use(authMiddleware, checkDisabled, checkApproved);

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const search = req.query.search || '';

    const where = {};
    if (search) {
      where.OR = [
        { nombre: { contains: search } },
        { marca: { contains: search } },
        { url: { contains: search } },
      ];
    }

    const [landings, total] = await Promise.all([
      prisma.landing.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { logs: true } }, templateType: true },
      }),
      prisma.landing.count({ where }),
    ]);

    res.json({
      data: landings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    logger.error({ err }, 'Error al obtener landings');
    res.status(500).json({ message: 'Error al obtener landings' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const landing = await prisma.landing.findFirst({
      where: { id: parseInt(req.params.id) },
      include: { logs: { orderBy: { createdAt: 'desc' }, take: 20 }, templateType: true },
    });
    if (!landing) return res.status(404).json({ message: 'Landing no encontrada' });
    res.json(landing);
  } catch (err) {
    logger.error({ err }, 'Error al obtener landing');
    res.status(500).json({ message: 'Error al obtener landing' });
  }
});

router.get('/:id/logs', async (req, res) => {
  try {
    const landing = await prisma.landing.findFirst({
      where: { id: parseInt(req.params.id) },
    });
    if (!landing) return res.status(404).json({ message: 'Landing no encontrada' });
    const logs = await prisma.checkLog.findMany({
      where: { landingId: landing.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(logs);
  } catch (err) {
    logger.error({ err }, 'Error al obtener logs');
    res.status(500).json({ message: 'Error al obtener logs' });
  }
});

router.post('/', landingValidation, async (req, res) => {
  try {
    const { nombre, marca, url, estado, categoria, templateTypeId, dynamicValues, visibleFields, ftpHost, ftpUser, ftpPass, ftpPath, tecnologias, notas, imagenUrl, sheetUrl, formStatus, tags, cliente } = req.body;
    const landing = await prisma.landing.create({
      data: {
        nombre, marca, url, estado: estado || 'ACTIVO', categoria: categoria || 'Cober',
        templateTypeId: templateTypeId ? Number(templateTypeId) : null,
        dynamicValues: dynamicValues ? JSON.stringify(dynamicValues) : null,
        visibleFields: visibleFields ? JSON.stringify(visibleFields) : null,
        ftpHost, ftpUser, ftpPass: ftpPass ? encrypt(ftpPass) : null, ftpPath, tecnologias, notas, imagenUrl, sheetUrl, formStatus, tags, cliente,
        userId: req.userId,
      },
    });
    await logAudit({ userId: req.userId, landingId: landing.id, action: 'CREATE', details: { nombre, marca, url } });
    res.status(201).json({ ...landing, ftpPass: ftpPass ? '***' : null });
  } catch (err) {
    logger.error({ err }, 'Error al crear landing');
    res.status(500).json({ message: 'Error al crear landing' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await prisma.landing.findFirst({
      where: { id: parseInt(req.params.id) },
    });
    if (!existing) return res.status(404).json({ message: 'Landing no encontrada' });

    const { nombre, marca, url, estado, categoria, templateTypeId, dynamicValues, visibleFields, ftpHost, ftpUser, ftpPass, ftpPath, tecnologias, notas, imagenUrl, sheetUrl, formStatus, tags, cliente } = req.body;
    const data = { nombre, marca, url, estado, categoria, ftpHost, ftpUser, ftpPath, tecnologias, notas, imagenUrl, sheetUrl, formStatus, tags, cliente };
    if (templateTypeId !== undefined) data.templateTypeId = templateTypeId ? Number(templateTypeId) : null;
    if (dynamicValues !== undefined) data.dynamicValues = dynamicValues ? JSON.stringify(dynamicValues) : null;
    if (visibleFields !== undefined) data.visibleFields = visibleFields ? JSON.stringify(visibleFields) : null;
    if (ftpPass) data.ftpPass = encrypt(ftpPass);
    const landing = await prisma.landing.update({
      where: { id: parseInt(req.params.id) },
      data,
    });
    await logAudit({ userId: req.userId, landingId: landing.id, action: 'UPDATE', details: { nombre, marca, url } });
    res.json({ ...landing, ftpPass: ftpPass ? '***' : null });
  } catch (err) {
    logger.error({ err }, 'Error al actualizar landing');
    res.status(500).json({ message: 'Error al actualizar landing' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.landing.findFirst({
      where: { id: parseInt(req.params.id) },
    });
    if (!existing) return res.status(404).json({ message: 'Landing no encontrada' });

    await prisma.landing.delete({ where: { id: parseInt(req.params.id) } });
    await logAudit({ userId: req.userId, landingId: null, action: 'DELETE', details: { id: req.params.id } });
    res.json({ message: 'Landing eliminada' });
  } catch (err) {
    logger.error({ err }, 'Error al eliminar landing');
    res.status(500).json({ message: 'Error al eliminar landing' });
  }
});

router.post('/:id/check', async (req, res) => {
  try {
    const landing = await prisma.landing.findFirst({
      where: { id: parseInt(req.params.id) },
    });
    if (!landing) return res.status(404).json({ message: 'Landing no encontrada' });

    const parsed = new URL(landing.url);
    const [urlResult, sslResult, metaTags] = await Promise.allSettled([
      checkUrl(landing.url),
      parsed.protocol === 'https:' ? checkSsl(parsed.hostname) : Promise.resolve({ valid: null, daysRemaining: null, error: 'No HTTPS' }),
      scanMetaTags(landing.url),
    ]);

    const url = urlResult.value;
    const ssl = sslResult.value;
    const tags = metaTags.value;

    const log = await prisma.checkLog.create({
      data: {
        landingId: landing.id,
        statusCode: url.statusCode,
        responseMs: url.responseMs,
        isUp: url.isUp,
        error: url.error,
      },
    });

    await prisma.landing.update({
      where: { id: landing.id },
      data: {
        ultimoCheck: new Date(),
        ultimoStatus: url.isUp ? 'UP' : 'DOWN',
        ultimoCodigo: url.statusCode,
        ultimoMs: url.responseMs,
        ultimoSslValido: ssl.valid,
        ultimoSslDias: ssl.daysRemaining,
        ultimoSslVence: ssl.expiresAt ? new Date(ssl.expiresAt) : null,
        ...(tags && !tags.error && Object.keys(tags).length > 0 && { metaTags: JSON.stringify(tags) }),
      },
    });

    const updatedLanding = { ...landing, ultimoStatus: url.isUp ? 'UP' : 'DOWN' };
    await processCheckResult({ landing: updatedLanding, urlResult: url, ssl });

    res.json({ url, ssl, log });
  } catch (err) {
    logger.error({ err }, 'Error al verificar landing');
    res.status(500).json({ message: 'Error al verificar landing' });
  }
});

router.post('/:id/deploy', async (req, res) => {
  try {
    const existing = await prisma.landing.findFirst({
      where: { id: parseInt(req.params.id) },
    });
    if (!existing) return res.status(404).json({ message: 'Landing no encontrada' });
    const landing = await prisma.landing.update({
      where: { id: existing.id },
      data: { ultimoDeploy: new Date() },
    });
    await logAudit({ userId: req.userId, landingId: landing.id, action: 'DEPLOY', details: { nombre: landing.nombre } });
    res.json(landing);
  } catch (err) {
    logger.error({ err }, 'Error al registrar deploy');
    res.status(500).json({ message: 'Error al registrar deploy' });
  }
});

router.get('/audit/all', async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(logs);
  } catch (err) {
    logger.error({ err }, 'Error al obtener auditoría');
    res.status(500).json({ message: 'Error al obtener auditoría' });
  }
});

router.post('/check-all', async (req, res) => {
  try {
    const landings = await prisma.landing.findMany({
      where: {
        OR: [
          { templateTypeId: null },
          { templateType: { hasMonitoring: true } },
        ],
      },
    });
    const CONCURRENCY = 10;
    const results = [];
    for (let i = 0; i < landings.length; i += CONCURRENCY) {
      const batch = landings.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(batch.map(async (landing) => {
        try {
          const urlResult = await checkUrl(landing.url);
          await prisma.checkLog.create({
            data: { landingId: landing.id, statusCode: urlResult.statusCode, responseMs: urlResult.responseMs, isUp: urlResult.isUp, error: urlResult.error },
          });
          await prisma.landing.update({
            where: { id: landing.id },
            data: { ultimoCheck: new Date(), ultimoStatus: urlResult.isUp ? 'UP' : 'DOWN', ultimoCodigo: urlResult.statusCode, ultimoMs: urlResult.responseMs },
          });
          const updatedLanding = { ...landing, ultimoStatus: urlResult.isUp ? 'UP' : 'DOWN' };
          await processCheckResult({ landing: updatedLanding, urlResult, ssl: null });
          return { id: landing.id, url: landing.url, isUp: urlResult.isUp };
        } catch (err) {
          logger.warn({ err: err.message, landingId: landing.id }, 'Error en check-all individual');
          return { id: landing.id, url: landing.url, isUp: false };
        }
      }));
      results.push(...batchResults);
    }
    res.json({ checked: results.length, results });
  } catch (err) {
    logger.error({ err }, 'Error al verificar todas');
    res.status(500).json({ message: 'Error al verificar todas' });
  }
});

router.post('/bulk/check', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ message: 'IDs requeridos' });
    const landings = await prisma.landing.findMany({
      where: { id: { in: ids.map((id) => parseInt(id)) } },
    });
    const results = [];
    const CONCURRENCY = 10;
    for (let i = 0; i < landings.length; i += CONCURRENCY) {
      const batch = landings.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(batch.map(async (landing) => {
        try {
          const urlResult = await checkUrl(landing.url);
          await prisma.checkLog.create({ data: { landingId: landing.id, statusCode: urlResult.statusCode, responseMs: urlResult.responseMs, isUp: urlResult.isUp, error: urlResult.error } });
          await prisma.landing.update({ where: { id: landing.id }, data: { ultimoCheck: new Date(), ultimoStatus: urlResult.isUp ? 'UP' : 'DOWN', ultimoCodigo: urlResult.statusCode, ultimoMs: urlResult.responseMs } });
          const updatedLanding = { ...landing, ultimoStatus: urlResult.isUp ? 'UP' : 'DOWN' };
          await processCheckResult({ landing: updatedLanding, urlResult, ssl: null });
          return { id: landing.id, url: landing.url, isUp: urlResult.isUp };
        } catch (err) {
          logger.warn({ err: err.message, landingId: landing.id }, 'Error en bulk check individual');
          return { id: landing.id, isUp: false };
        }
      }));
      results.push(...batchResults);
    }
    res.json({ checked: results.length, results });
  } catch (err) {
    logger.error({ err }, 'Error en bulk check');
    res.status(500).json({ message: 'Error' });
  }
});

router.post('/bulk/delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ message: 'IDs requeridos' });
    const landings = await prisma.landing.findMany({
      where: { id: { in: ids.map((id) => parseInt(id)) } },
      select: { id: true },
    });
    if (landings.length === 0) return res.json({ deleted: 0 });
    await prisma.landing.deleteMany({ where: { id: { in: landings.map((l) => l.id) } } });
    for (const l of landings) {
      await logAudit({ userId: req.userId, landingId: null, action: 'DELETE', details: { bulk: true, id: l.id } });
    }
    res.json({ deleted: landings.length });
  } catch (err) {
    logger.error({ err }, 'Error en bulk delete');
    res.status(500).json({ message: 'Error' });
  }
});

router.get('/export/csv', async (req, res) => {
  try {
    const landings = await prisma.landing.findMany({ orderBy: { createdAt: 'desc' } });
    const headers = ['Nombre', 'Marca', 'URL', 'Estado', 'Categoría', 'Tags', 'Último Status', 'Código', 'Tiempo (ms)', 'SSL (días)', 'Form Status', 'Tecnologías', 'Cliente'];
    const rows = landings.map((l) => [
      l.nombre, l.marca, l.url, l.estado, l.categoria, l.tags || '',
      l.ultimoStatus || '', l.ultimoCodigo || '', l.ultimoMs || '', l.ultimoSslDias ?? '', l.formStatus, l.tecnologias || '', l.cliente || '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=branches-${new Date().toISOString().slice(0, 10)}.csv`);
    res.send('\ufeff' + csv);
  } catch (err) {
    logger.error({ err }, 'Error al exportar CSV');
    res.status(500).json({ message: 'Error al exportar' });
  }
});

module.exports = router;