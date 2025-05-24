import { Request, Response, NextFunction } from 'express';
import { check, body, validationResult } from 'express-validator';

const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
  } else {
    next();
  }
};

export const validateRegister = [
  check('email')
    .isEmail()
    .withMessage('Please enter a valid email address'),
  check('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors,
];

export const validateLogin = [
  check('email')
    .isEmail()
    .withMessage('Please enter a valid email address'),
  check('password') // For login, we might not need strict length, just that it exists
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors,
];

export const validateFolderCreate = [
  check('name')
    .isString()
    .withMessage('Folder name must be a string')
    .notEmpty()
    .withMessage('Folder name cannot be empty')
    .trim(), // Remove leading/trailing whitespace
  handleValidationErrors,
];

export const validateFolderUpdate = [
  body('name')
    .optional()
    .isString()
    .withMessage('Name must be a string')
    .trim()
    .notEmpty()
    .withMessage('Name, if provided, cannot be empty'),
  body('description')
    .optional({ nullable: true }) // Allows description to be explicitly null or absent
    .isString()
    .withMessage('Description, if provided and not null, must be a string')
    .trim(), // Allow empty string for description
  handleValidationErrors, // Reuse existing error handler
];
