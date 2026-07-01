const { PrismaClient } = require('@prisma/client');
const { logger } = require('./logger');

const globalForPrisma = globalThis;

const prisma = globalForPrisma.__prisma ||
  new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.__prisma = prisma;

prisma.$on('warn', (e) => logger.warn({ prisma: e.message }, 'Prisma warning'));

module.exports = prisma;