const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const prisma = require('../lib/prisma');
const { authMiddleware, checkDisabled, adminMiddleware, JWT_SECRET, generateTokens, REFRESH_EXPIRY_DAYS, PLAN_LIMITS } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { loginValidation, registerValidation } = require('../middleware/validator');
const { sendPasswordReset } = require('../lib/mailer');
const { logger } = require('../lib/logger');

const router = express.Router();

function buildUserResponse(user) {
  return {
    id: user.id,
    email: user.email,
    nombre: user.nombre,
    role: user.role,
    plan: user.plan || 'free',
    notifyEmail: user.notifyEmail,
    sendSslAlerts: user.sendSslAlerts,
    avatarUrl: user.avatarUrl,
    disabled: user.disabled,
  };
}

function signToken(user, type, expiry) {
  return jwt.sign({ id: user.id, email: user.email, type }, JWT_SECRET, { expiresIn: expiry });
}

async function upsertUserFromOAuth({ email, nombre, avatarUrl, provider, providerId }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (!existing.provider || existing.provider !== provider) {
      await prisma.user.update({ where: { id: existing.id }, data: { provider, providerId, avatarUrl: avatarUrl || existing.avatarUrl } });
    }
    return existing;
  }
  return prisma.user.create({
    data: {
      email, nombre, password: crypto.randomBytes(32).toString('hex'),
      provider, providerId, avatarUrl,
      emailVerified: true,
    },
  });
}

router.post('/register', authLimiter, registerValidation, async (req, res) => {
  try {
    const { email, password, nombre } = req.body;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ message: 'El email ya está registrado' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, password: hashed, nombre, emailVerificationToken: crypto.randomBytes(32).toString('hex') } });
    const { accessToken, refreshToken } = await generateTokens(user.id, user.email);
    res.json({ token: accessToken, refreshToken, user: buildUserResponse(user) });
  } catch (err) {
    logger.error({ err }, 'Error en registro');
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.post('/login', authLimiter, loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });
    if (user.disabled) return res.status(403).json({ message: 'Cuenta deshabilitada. Contactá al administrador.', code: 'ACCOUNT_DISABLED' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Credenciales inválidas' });
    const { accessToken, refreshToken } = await generateTokens(user.id, user.email);
    res.json({ token: accessToken, refreshToken, user: buildUserResponse(user) });
  } catch (err) {
    logger.error({ err }, 'Error en login');
    res.status(500).json({ message: 'Error del servidor' });
  }
});

const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

router.post('/oauth/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: 'idToken requerido' });
    if (!googleClient) {
      return res.status(501).json({ message: 'OAuth de Google no configurado. Definí GOOGLE_CLIENT_ID en el servidor.' });
    }
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const user = await upsertUserFromOAuth({
      email: payload.email,
      nombre: payload.name || payload.email,
      avatarUrl: payload.picture,
      provider: 'google',
      providerId: payload.sub,
    });
    const { accessToken, refreshToken } = await generateTokens(user.id, user.email);
    res.json({ token: accessToken, refreshToken, user: buildUserResponse(user) });
  } catch (err) {
    logger.error({ err }, 'Error en OAuth Google');
    res.status(401).json({ message: 'Token de OAuth inválido' });
  }
});

router.post('/refresh', authLimiter, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'Refresh token requerido' });
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET);
      if (decoded.type !== 'refresh') throw new Error('wrong type');
    } catch {
      return res.status(401).json({ message: 'Refresh token inválido o expirado' });
    }
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ message: 'Usuario no encontrado' });
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    if (user.refreshTokenHash && user.refreshTokenHash !== tokenHash) {
      return res.status(401).json({ message: 'Refresh token ya fue utilizado' });
    }
    await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: null } });
    const newTokens = await generateTokens(user.id, user.email);
    res.json({ token: newTokens.accessToken, refreshToken: newTokens.refreshToken, user: buildUserResponse(user) });
  } catch (err) {
    logger.error({ err }, 'Error en refresh');
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.post('/logout', async (req, res) => {
  res.json({ message: 'Sesión cerrada' });
});

router.get('/me', authMiddleware, checkDisabled, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(buildUserResponse(user));
  } catch (err) {
    logger.error({ err }, 'Error en /me');
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.put('/settings', authMiddleware, checkDisabled, async (req, res) => {
  try {
    const { notifyEmail, sendSslAlerts } = req.body;
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(typeof notifyEmail === 'boolean' && { notifyEmail }),
        ...(typeof sendSslAlerts === 'boolean' && { sendSslAlerts }),
      },
    });
    res.json(buildUserResponse(user));
  } catch (err) {
    logger.error({ err }, 'Error al actualizar configuración');
    res.status(500).json({ message: 'Error al actualizar configuración' });
  }
});

router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email requerido' });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json({ message: 'Si el email existe, recibirás un enlace de recuperación' });
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expires = new Date(Date.now() + 3600000);
    await prisma.user.update({ where: { id: user.id }, data: { resetPasswordToken: tokenHash, resetPasswordExpires: expires } });
    const resetUrl = `${process.env.APP_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}&email=${email}`;
    await sendPasswordReset(user.email, user.nombre, resetUrl);
    res.json({ message: 'Si el email existe, recibirás un enlace de recuperación' });
  } catch (err) {
    logger.error({ err }, 'Error en forgot-password');
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { token, email, password } = req.body;
    if (!token || !email || !password) return res.status(400).json({ message: 'Todos los campos son requeridos' });
    if (password.length < 6) return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.resetPasswordToken !== tokenHash || !user.resetPasswordExpires) return res.status(400).json({ message: 'Token inválido o expirado' });
    if (new Date() > user.resetPasswordExpires) return res.status(400).json({ message: 'Token expirado' });
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed, resetPasswordToken: null, resetPasswordExpires: null } });
    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (err) {
    logger.error({ err }, 'Error en reset-password');
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/users', authMiddleware, checkDisabled, adminMiddleware, async (req, res) => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, email: true, nombre: true, role: true, plan: true, disabled: true, createdAt: true } });
    res.json(users);
  } catch (err) {
    logger.error({ err }, 'Error al listar usuarios');
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.put('/users/:id/role', authMiddleware, checkDisabled, adminMiddleware, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ message: 'Rol inválido' });
    const user = await prisma.user.update({ where: { id: parseInt(req.params.id) }, data: { role } });
    res.json({ id: user.id, email: user.email, nombre: user.nombre, role: user.role });
  } catch (err) {
    logger.error({ err }, 'Error al actualizar rol');
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.put('/users/:id/toggle-status', authMiddleware, checkDisabled, adminMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    if (user.id === req.userId) return res.status(400).json({ message: 'No podés deshabilitarte a vos mismo' });
    const updated = await prisma.user.update({ where: { id: user.id }, data: { disabled: !user.disabled } });
    res.json({ id: updated.id, email: updated.email, nombre: updated.nombre, disabled: updated.disabled });
  } catch (err) {
    logger.error({ err }, 'Error al cambiar estado del usuario');
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.delete('/users/:id', authMiddleware, checkDisabled, adminMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    if (user.id === req.userId) return res.status(400).json({ message: 'No podés eliminarte a vos mismo' });
    await prisma.user.delete({ where: { id: user.id } });
    res.json({ message: 'Usuario eliminado', id: user.id, email: user.email });
  } catch (err) {
    logger.error({ err }, 'Error al eliminar usuario');
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.put('/profile', authMiddleware, checkDisabled, async (req, res) => {
  try {
    const { nombre, email, currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    if (email && email !== user.email) {
      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists) return res.status(400).json({ message: 'El email ya está en uso' });
    }

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ message: 'Contraseña actual requerida para cambios' });
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return res.status(400).json({ message: 'Contraseña actual incorrecta' });
      if (newPassword.length < 6) return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    const data = {};
    if (nombre) data.nombre = nombre;
    if (email) data.email = email;
    if (newPassword) data.password = await bcrypt.hash(newPassword, 10);

    const updated = await prisma.user.update({ where: { id: req.userId }, data });
    res.json(buildUserResponse(updated));
  } catch (err) {
    logger.error({ err }, 'Error al actualizar perfil');
    res.status(500).json({ message: 'Error al actualizar perfil' });
  }
});

router.put('/plan', authMiddleware, checkDisabled, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!PLAN_LIMITS[plan]) return res.status(400).json({ message: 'Plan inválido', available: Object.keys(PLAN_LIMITS) });
    const user = await prisma.user.update({ where: { id: req.userId }, data: { plan } });
    res.json(buildUserResponse(user));
  } catch (err) {
    logger.error({ err }, 'Error al cambiar plan');
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/stats', authMiddleware, checkDisabled, async (req, res) => {
  try {
    const [landingCount, logCount, webhookCount] = await Promise.all([
      prisma.landing.count({ where: { userId: req.userId } }),
      prisma.checkLog.count({ where: { landing: { userId: req.userId } } }),
      prisma.webhookConfig.count({ where: { userId: req.userId } }),
    ]);
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const plan = user?.plan || 'free';
    res.json({
      landings: landingCount,
      logs: logCount,
      webhooks: webhookCount,
      plan,
      limit: PLAN_LIMITS[plan] ?? PLAN_LIMITS.free,
    });
  } catch (err) {
    logger.error({ err }, 'Error al obtener stats');
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;