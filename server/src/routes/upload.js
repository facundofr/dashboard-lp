const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { fileTypeFromFile } = require('file-type');
const { authMiddleware, checkDisabled } = require('../middleware/auth');
const { logger } = require('../lib/logger');

const router = express.Router();
router.use(authMiddleware, checkDisabled);

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']);
const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
});

router.post('/image', async (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      logger.error({ err: err.message }, 'Error en upload');
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'La imagen no puede superar los 5MB' });
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) return res.status(400).json({ message: 'No se envió ningún archivo' });

    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return res.status(400).json({ message: 'Extensión no permitida. Solo: jpg, png, gif, webp, svg' });
    }
    try {
      const tmpPath = path.join(uploadDir, `tmp-${crypto.randomBytes(16).toString('hex')}${ext}`);
      fs.writeFileSync(tmpPath, req.file.buffer);
      const type = await fileTypeFromFile(tmpPath);
      if (!type || !ALLOWED_MIMES.has(type.mime)) {
        fs.unlinkSync(tmpPath);
        return res.status(400).json({ message: 'Solo imágenes (jpg, png, gif, webp, svg)' });
      }
      const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
      const finalPath = path.join(uploadDir, filename);
      fs.renameSync(tmpPath, finalPath);
      const url = `/uploads/${filename}`;
      res.json({ url, filename });
    } catch (verifyErr) {
      logger.error({ err: verifyErr.message }, 'Error al verificar archivo');
      res.status(400).json({ message: 'Error al procesar la imagen' });
    }
  });
});

module.exports = router;
