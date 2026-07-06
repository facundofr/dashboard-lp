const prisma = require('./prisma');
const { sendDownAlert, sendSslAlert } = require('./mailer');
const { sendWebhook } = require('./webhook');
const { logger } = require('./logger');

async function processCheckResult({ landing, urlResult, ssl }) {
  const previousDown = landing.ultimoStatus === 'DOWN';
  const nowDown = !urlResult.isUp;
  const sslExpiring = ssl && ssl.valid && ssl.daysRemaining !== null && ssl.daysRemaining < 7;

  const openIncident = await prisma.incident.findFirst({
    where: { landingId: landing.id, recoveredAt: null },
  });

  const users = await prisma.user.findMany({
    where: { landings: { some: { id: landing.id } } },
  });
  const webhooks = await prisma.webhookConfig.findMany({
    where: { enabled: true, userId: { in: users.map((u) => u.id) } },
  });

  if (!previousDown && nowDown) {
    await prisma.incident.create({
      data: { landingId: landing.id, startedAt: new Date() },
    });

    for (const user of users) {
      if (user.notifyEmail) {
        await sendDownAlert(user.email, user.nombre, {
          ...landing,
          ultimoCodigo: urlResult.statusCode,
          ultimoMs: urlResult.responseMs,
          ultimoCheck: new Date(),
        });
      }
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: `${landing.nombre} está CAÍDA`,
          description: `${landing.url} — Status: ${urlResult.statusCode || 'N/A'}`,
          type: 'error',
        },
      });
    }
    for (const wh of webhooks) {
      if (wh.events.includes('down')) {
        await sendWebhook(wh, {
          event: 'down',
          landing: {
            ...landing,
            ultimoCodigo: urlResult.statusCode,
            ultimoMs: urlResult.responseMs,
          },
        });
      }
    }
    logger.warn({ landingId: landing.id, url: landing.url }, 'INCIDENTE: landing CAÍDA');
  }

  if (previousDown && !nowDown && openIncident) {
    const duration = Math.round((Date.now() - new Date(openIncident.startedAt).getTime()) / 1000);
    await prisma.incident.update({
      where: { id: openIncident.id },
      data: { recoveredAt: new Date(), duration },
    });

    for (const user of users) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: `${landing.nombre} recuperada`,
          description: `Estuvo caída ${formatDuration(duration)}`,
          type: 'success',
        },
      });
    }
    logger.info({ landingId: landing.id, duration, url: landing.url }, 'RECUPERACIÓN: landing ONLINE');
  }

  if (sslExpiring && ssl.daysRemaining !== landing.ultimoSslDias) {
    for (const user of users) {
      if (user.sendSslAlerts) {
        await sendSslAlert(user.email, user.nombre, landing, ssl.daysRemaining);
      }
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: `SSL próximo a vencer: ${landing.nombre}`,
          description: `Vence en ${ssl.daysRemaining} días`,
          type: 'warning',
        },
      });
    }
    for (const wh of webhooks) {
      if (wh.events.includes('ssl_expiring')) {
        await sendWebhook(wh, { event: 'ssl_expiring', landing, daysRemaining: ssl.daysRemaining });
      }
    }
  }
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

module.exports = { processCheckResult };
