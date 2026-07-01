const pino = require('pino');

const isProduction = process.env.NODE_ENV === 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  transport: isProduction
    ? undefined
    : { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:yyyy-mm-dd HH:MM:ss' } },
});

module.exports = { logger };