const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../lib/prisma');
const { logger } = require('../lib/logger');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  logger.error('JWT_SECRET no está definido en las variables de entorno');
  process.exit(1);
}

const ACCESS_EXPIRY = '7d';
const REFRESH_EXPIRY_DAYS = 30;

const PLAN_LIMITS = {
  free: 10,
  pro: 100,
  team: 1000,
};

function generateTokens(userId, email) {
  const accessToken = jwt.sign({ id: userId, email, type: 'access' }, JWT_SECRET, { expiresIn: ACCESS_EXPIRY });
  return { accessToken };
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  let token = null;
  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ message: 'Token requerido', code: 'NO_TOKEN' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'access') {
      return res.status(401).json({ message: 'Token inválido', code: 'WRONG_TYPE' });
    }
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ message: 'Token inválido', code: 'INVALID_TOKEN' });
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET);
      if (decoded.type === 'access') {
        req.userId = decoded.id;
        req.userEmail = decoded.email;
      }
    } catch (err) {
      logger.warn({ err: err.message }, 'Token inválido en optionalAuth');
    }
  }
  next();
}

async function adminMiddleware(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (user && user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: 'Acceso no autorizado' });
    }
  } catch (err) {
    logger.error({ err }, 'Error en adminMiddleware');
    res.status(500).json({ message: 'Error del servidor' });
  }
}

async function apiKeyMiddleware(req, res, next) {
  const key = req.headers['x-api-key'] || req.query.api_key;
  if (!key) {
    return res.status(401).json({ message: 'API key requerida' });
  }
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  try {
    const apiKey = await prisma.apiKey.findFirst({
      where: { keyHash: hash, enabled: true },
      include: { user: true },
    });
    if (!apiKey) return res.status(401).json({ message: 'API key inválida' });
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return res.status(401).json({ message: 'API key expirada' });
    }
    await prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } });
    req.userId = apiKey.userId;
    req.user = apiKey.user;
    req.apiKeyId = apiKey.id;
    next();
  } catch (err) {
    logger.error({ err }, 'Error en apiKeyMiddleware');
    res.status(500).json({ message: 'Error del servidor' });
  }
}

async function planMiddleware(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const plan = user?.plan || 'free';
    const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
    const count = await prisma.landing.count({ where: { userId: req.userId } });
    if (count >= limit) {
      return res.status(403).json({
        message: `Límite del plan ${plan} alcanzado (${limit} landings). Actualizá tu plan para agregar más.`,
        code: 'PLAN_LIMIT',
        plan,
        limit,
        current: count,
      });
    }
    next();
  } catch (err) {
    logger.error({ err }, 'Error en planMiddleware');
    next();
  }
}

module.exports = {
  authMiddleware,
  optionalAuth,
  adminMiddleware,
  apiKeyMiddleware,
  planMiddleware,
  PLAN_LIMITS,
  JWT_SECRET,
  generateTokens,
  REFRESH_EXPIRY_DAYS,
};