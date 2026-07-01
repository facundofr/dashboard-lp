require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const path = require('path');
const prisma = require('./lib/prisma');
const { logger } = require('./lib/logger');
const { checkUrl, checkSsl, scanMetaTags } = require('./lib/checker');
const { sendDownAlert, sendSslAlert } = require('./lib/mailer');
const { sendWebhook } = require('./lib/webhook');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const landingRoutes = require('./routes/landings');
const healthRoutes = require('./routes/health');
const uploadRoutes = require('./routes/upload');
const webhookRoutes = require('./routes/webhooks');
const statusPageRoutes = require('./routes/statuspage');
const publicApiRoutes = require('./routes/publicapi');

const app = express();
const PORT = process.env.PORT || 3001;
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({ origin: corsOrigin, methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], credentials: true }));
app.use(express.json({ limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/api', apiLimiter);

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/landings', landingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/status', statusPageRoutes);
app.use('/v1', publicApiRoutes);

const clientBuild = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientBuild));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/v1') || req.path.startsWith('/status')) return next();
  res.sendFile(path.join(clientBuild, 'index.html'));
});

app.use(errorHandler);

const server = app.listen(PORT, () => {
  logger.info({ port: PORT, corsOrigin }, `Servidor corriendo en http://localhost:${PORT}`);
  setTimeout(autoCheckAll, 30000);
});

setInterval(autoCheckAll, 15 * 60 * 1000);

async function autoCheckAll() {
  try {
    const landings = await prisma.landing.findMany({ where: { estado: 'ACTIVO' } });
    logger.info({ count: landings.length }, 'Auto-check iniciado');

    const CONCURRENCY = 10;
    for (let i = 0; i < landings.length; i += CONCURRENCY) {
      const batch = landings.slice(i, i + CONCURRENCY);
      await Promise.allSettled(batch.map((landing) => checkOneLanding(landing)));
    }
    logger.info('Auto-check completado');
  } catch (err) {
    logger.error({ err: err.message }, 'Error en auto-check general');
  }
}

async function checkOneLanding(landing) {
  try {
    const parsed = new URL(landing.url);
    const [urlResult, metaTagsResult, sslResult] = await Promise.allSettled([
      checkUrl(landing.url),
      scanMetaTags(landing.url),
      parsed.protocol === 'https:' ? checkSsl(parsed.hostname) : Promise.resolve({ valid: null, daysRemaining: null, error: 'No HTTPS' }),
    ]);

    const url = urlResult.value;
    const metaTags = metaTagsResult.status === 'fulfilled' ? metaTagsResult.value : {};
    const ssl = sslResult.status === 'fulfilled' ? sslResult.value : { valid: false, daysRemaining: null, error: 'SSL error' };

    await prisma.checkLog.create({
      data: { landingId: landing.id, statusCode: url.statusCode, responseMs: url.responseMs, isUp: url.isUp, error: url.error },
    });

    const updateData = {
      ultimoCheck: new Date(),
      ultimoStatus: url.isUp ? 'UP' : 'DOWN',
      ultimoCodigo: url.statusCode,
      ultimoMs: url.responseMs,
      ultimoSslValido: ssl.valid,
      ultimoSslDias: ssl.daysRemaining,
      ultimoSslVence: ssl.expiresAt ? new Date(ssl.expiresAt) : null,
    };

    if (metaTags && !metaTags.error && Object.keys(metaTags).length > 0) {
      updateData.metaTags = JSON.stringify(metaTags);
    }

    await prisma.landing.update({ where: { id: landing.id }, data: updateData });

    const wasDown = !url.isUp;
    const sslExpiring = ssl.valid && ssl.daysRemaining !== null && ssl.daysRemaining < 7;

    if (wasDown || sslExpiring) {
      const users = await prisma.user.findMany({ where: { landings: { some: { id: landing.id } } } });
      const webhooks = await prisma.webhookConfig.findMany({ where: { enabled: true, userId: { in: users.map((u) => u.id) } } });
      for (const user of users) {
        if (wasDown && user.notifyEmail) {
          await sendDownAlert(user.email, user.nombre, { ...landing, ultimoCodigo: url.statusCode, ultimoMs: url.responseMs, ultimoCheck: new Date() });
        }
        if (sslExpiring && user.sendSslAlerts) {
          await sendSslAlert(user.email, user.nombre, landing, ssl.daysRemaining);
        }
      }
      for (const wh of webhooks) {
        if (wasDown && wh.events.includes('down')) {
          await sendWebhook(wh, { event: 'down', landing: { ...landing, ultimoCodigo: url.statusCode, ultimoMs: url.responseMs } });
        }
        if (sslExpiring && wh.events.includes('ssl_expiring')) {
          await sendWebhook(wh, { event: 'ssl_expiring', landing, daysRemaining: ssl.daysRemaining });
        }
      }
    }
  } catch (err) {
    logger.error({ err: err.message, url: landing.url }, 'Error en check individual');
  }
}

module.exports = { app, autoCheckAll };