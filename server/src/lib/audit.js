const prisma = require('./prisma');
const { logger } = require('./logger');

async function logAudit({ userId, landingId, action, details }) {
  try {
    await prisma.auditLog.create({
      data: { userId, landingId, action, details: details ? JSON.stringify(details) : null },
    });
  } catch (err) {
    logger.warn({ err: err.message }, 'Audit log error');
  }
}

module.exports = { logAudit };