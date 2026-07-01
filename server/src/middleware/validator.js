const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Datos inválidos', errors: errors.array() });
  }
  next();
};

const loginValidation = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Contraseña requerida'),
  handleValidationErrors,
];

const registerValidation = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('nombre').notEmpty().withMessage('El nombre es requerido').trim(),
  handleValidationErrors,
];

const landingValidation = [
  body('nombre').notEmpty().withMessage('El nombre es requerido').trim(),
  body('marca').notEmpty().withMessage('La marca es requerida').trim(),
  body('url').isURL({ require_protocol: true }).withMessage('URL inválida'),
  handleValidationErrors,
];

module.exports = { loginValidation, registerValidation, landingValidation };