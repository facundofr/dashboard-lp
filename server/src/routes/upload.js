const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { fileTypeFromFile } = require('file-type');
const { authMiddleware, checkDisabled } = require('../middleware/auth');
const { logger } = require('../lib/logger');

const router = express.Router();
router.use(authMiddleware, checkDisabled);

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/image', async (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      logger.error({ err: err.message }, 'Error en upload');
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) return res.status(400).json({ message: 'No se envió ningún archivo' });
    try {
      const type = await fileTypeFromFile(req.file.path);
      if (!type || !ALLOWED_MIMES.has(type.mime)) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'Solo imágenes (jpg, png, gif, webp, svg)' });
      }
      const url = `/uploads/${req.file.filename}`;
      res.json({ url, filename: req.file.filename });
    } catch (verifyErr) {
      fs.unlinkSync(req.file.path);
      logger.error({ err: verifyErr.message }, 'Error al verificar archivo');
      res.status(400).json({ message: 'Error al procesar la imagen' });
    }
  });
});

module.exports = router;
