import { Request, Response, NextFunction } from 'express';
import { check, param, body, validationResult } from 'express-validator';

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

export const validateSetIdParams = [
  check('folderId')
    .isInt({ gt: 0 })
    .withMessage('Folder ID parameter must be a positive integer'),
  check('setId')
    .isInt({ gt: 0 })
    .withMessage('Set ID parameter must be a positive integer'),
  handleValidationErrors,
];

export const validateQuestionCreate = [
  check('text')
    .notEmpty()
    .withMessage('Question text cannot be empty')
    .isString()
    .withMessage('Question text must be a string')
    .trim(),
  check('questionType')
    .notEmpty()
    .withMessage('Question type cannot be empty')
    .isString()
    .withMessage('Question type must be a string')
    .trim(),
  // 'answer' is optional in the schema (String?)
  check('answer')
    .optional({ nullable: true })
    .isString()
    .withMessage('Answer, if provided, must be a string')
    .trim(),
  // 'options' is an array of strings (String[])
  check('options')
    .optional()
    .isArray()
    .withMessage('Options, if provided, must be an array'),
  check('options.*') // Validate each item in the options array
    .if((value, { req }) => req.body.options && Array.isArray(req.body.options)) // only run if options is an array
    .isString()
    .withMessage('Each option must be a string')
    .notEmpty()
    .withMessage('Options cannot contain empty strings')
    .trim(),
  handleValidationErrors,
];

export const validateQuestionId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Question ID must be a positive integer')
    .toInt(),
  handleValidationErrors,
];

export const validateQuestionUpdate = [
  check('text')
    .optional()
    .isString()
    .withMessage('Question text must be a string')
    .trim(),
  check('questionType')
    .optional()
    .isString()
    .withMessage('Question type must be a string')
    .trim(),
  check('answer')
    .optional()
    .isString()
    .withMessage('Answer must be a string')
    .trim(),
  check('options')
    .optional()
    .isArray()
    .withMessage('Options must be an array')
    .custom((options) => {
      if (options && options.length > 0) {
        for (const option of options) {
          if (typeof option !== 'string' || option.trim() === '') {
            throw new Error('Options must be non-empty strings');
          }
        }
      }
      return true;
    }),
  handleValidationErrors,
];

export const validateGenerateFromSource = [
  check('sourceText')
    .notEmpty()
    .withMessage('Source text cannot be empty')
    .isString()
    .withMessage('Source text must be a string')
    .trim(),
  check('folderId')
    .notEmpty()
    .withMessage('Folder ID is required')
    .isInt({ gt: 0 })
    .withMessage('Folder ID must be a positive integer')
    .toInt(),
  check('questionCount')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Question count must be between 1 and 20')
    .toInt(),
  handleValidationErrors,
];

export const validateChatWithAI = [
  check('message')
    .notEmpty()
    .withMessage('Message cannot be empty')
    .isString()
    .withMessage('Message must be a string')
    .trim(),
  check('questionSetId')
    .optional()
    .isInt({ gt: 0 })
    .withMessage('Question set ID must be a positive integer')
    .toInt(),
  check('folderId')
    .optional()
    .isInt({ gt: 0 })
    .withMessage('Folder ID must be a positive integer')
    .toInt(),
  handleValidationErrors,
];

export const validateSubmitReview = [
  check('questionSetId')
    .notEmpty()
    .withMessage('Question set ID is required')
    .isString()
    .withMessage('Question set ID must be a string representation of a number') // Will be parsed to int in controller
    .trim(),
  check('outcomes')
    .notEmpty()
    .withMessage('Outcomes are required')
    .isArray({ min: 1 })
    .withMessage('Outcomes must be a non-empty array'),
  check('outcomes.*.questionId')
    .notEmpty()
    .withMessage('Question ID is required for each outcome')
    .isString()
    .withMessage('Question ID must be a string for each outcome')
    .trim(),
  check('outcomes.*.scoreAchieved')
    .notEmpty()
    .withMessage('Score achieved is required for each outcome')
    .isInt({ min: 0, max: 5 }) 
    .withMessage('Score achieved must be an integer between 0 and 5 (or max marks for question) for each outcome')
    .toInt(),
  check('outcomes.*.uueFocus')
    .notEmpty()
    .withMessage('UUE focus is required for each outcome')
    .isString()
    .withMessage('UUE focus must be a string for each outcome')
    .isIn(['Understand', 'Use', 'Explore'])
    .withMessage('UUE focus must be one of "Understand", "Use", or "Explore" for each outcome'),
  check('outcomes.*.userAnswerText')
    .exists() // Ensure the field is present, even if an empty string
    .isString()
    .withMessage('User answer text must be a string for each outcome')
    .trim(), // Trim, but allow empty string
  check('sessionDurationSeconds')
    .notEmpty()
    .withMessage('sessionDurationSeconds is required')
    .isInt({ min: 0 })
    .withMessage('sessionDurationSeconds must be a non-negative number')
    .toInt(),
  handleValidationErrors,
];

export const validateQuestionSetCreate = [
  check('name')
    .notEmpty()
    .withMessage('Question set name is required')
    .isString()
    .withMessage('Question set name must be a string')
    .trim(),
  handleValidationErrors,
];

export const validateQuestionSetUpdate = [
  check('name')
    .notEmpty()
    .withMessage('Question set name is required')
    .isString()
    .withMessage('Question set name must be a string')
    .trim(),
  handleValidationErrors,
];
