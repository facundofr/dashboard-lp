const express = require('express');
const prisma = require('../lib/prisma');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { logger } = require('../lib/logger');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const types = await prisma.templateType.findMany({
      include: { fieldDefinitions: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { name: 'asc' },
    });
    res.json(types);
  } catch (err) {
    logger.error({ err }, 'Error al obtener tipos de template');
    res.status(500).json({ message: 'Error al obtener tipos de template' });
  }
});

router.post('/', adminMiddleware, async (req, res) => {
  try {
    const { name, icon, description, hasMonitoring, fields } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'El nombre es requerido' });
    const type = await prisma.templateType.create({
      data: {
        name: name.trim(),
        icon: icon || '📄',
        description,
        hasMonitoring: hasMonitoring || false,
        ...(Array.isArray(fields) && fields.length > 0 ? {
          fieldDefinitions: {
            create: fields.map((f, i) => ({
              name: f.name,
              label: f.label,
              fieldType: f.fieldType || 'text',
              required: f.required || false,
              sortOrder: f.sortOrder ?? i,
              placeholder: f.placeholder || null,
              options: f.options || null,
              defaultVisible: f.defaultVisible !== false,
            })),
          },
        } : {}),
      },
      include: { fieldDefinitions: { orderBy: { sortOrder: 'asc' } } },
    });
    res.status(201).json(type);
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ message: 'Ya existe un tipo con ese nombre' });
    logger.error({ err }, 'Error al crear tipo de template');
    res.status(500).json({ message: 'Error al crear tipo de template' });
  }
});

router.put('/:id', adminMiddleware, async (req, res) => {
  try {
    const { name, icon, description, hasMonitoring } = req.body;
    const type = await prisma.templateType.update({
      where: { id: Number(req.params.id) },
      data: { name, icon, description, hasMonitoring },
    });
    res.json(type);
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ message: 'Ya existe un tipo con ese nombre' });
    logger.error({ err }, 'Error al actualizar tipo de template');
    res.status(500).json({ message: 'Error al actualizar tipo de template' });
  }
});

router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    await prisma.templateType.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Tipo eliminado' });
  } catch (err) {
    logger.error({ err }, 'Error al eliminar tipo de template');
    res.status(500).json({ message: 'Error al eliminar tipo de template' });
  }
});

router.get('/:id/fields', async (req, res) => {
  try {
    const fields = await prisma.fieldDefinition.findMany({
      where: { templateTypeId: Number(req.params.id) },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(fields);
  } catch (err) {
    logger.error({ err }, 'Error al obtener campos');
    res.status(500).json({ message: 'Error al obtener campos' });
  }
});

router.post('/:id/fields', adminMiddleware, async (req, res) => {
  try {
    const { name, label, fieldType, required, sortOrder, placeholder, options, defaultVisible } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'El nombre del campo es requerido' });
    if (!label || !label.trim()) return res.status(400).json({ message: 'La etiqueta del campo es requerida' });
    const field = await prisma.fieldDefinition.create({
      data: {
        templateTypeId: Number(req.params.id),
        name: name.trim(),
        label: label.trim(),
        fieldType: fieldType || 'text',
        required: required || false,
        sortOrder: sortOrder || 0,
        placeholder,
        options,
        defaultVisible: defaultVisible !== false,
      },
    });
    res.status(201).json(field);
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ message: 'Ya existe un campo con ese nombre en este tipo' });
    logger.error({ err }, 'Error al crear campo');
    res.status(500).json({ message: 'Error al crear campo' });
  }
});

router.put('/:id/fields/:fieldId', adminMiddleware, async (req, res) => {
  try {
    const { name, label, fieldType, required, sortOrder, placeholder, options, defaultVisible } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (label !== undefined) data.label = label;
    if (fieldType !== undefined) data.fieldType = fieldType;
    if (required !== undefined) data.required = required;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;
    if (placeholder !== undefined) data.placeholder = placeholder;
    if (options !== undefined) data.options = options;
    if (defaultVisible !== undefined) data.defaultVisible = defaultVisible;
    const field = await prisma.fieldDefinition.update({
      where: { id: Number(req.params.fieldId) },
      data,
    });
    res.json(field);
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ message: 'Ya existe un campo con ese nombre en este tipo' });
    logger.error({ err }, 'Error al actualizar campo');
    res.status(500).json({ message: 'Error al actualizar campo' });
  }
});

router.delete('/:id/fields/:fieldId', adminMiddleware, async (req, res) => {
  try {
    await prisma.fieldDefinition.delete({ where: { id: Number(req.params.fieldId) } });
    res.json({ message: 'Campo eliminado' });
  } catch (err) {
    logger.error({ err }, 'Error al eliminar campo');
    res.status(500).json({ message: 'Error al eliminar campo' });
  }
});

module.exports = router;
