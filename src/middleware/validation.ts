import { Request, Response, NextFunction } from 'express';
import { check, param, body, validationResult } from 'express-validator';
import { QuestionScope, QuestionTone } from '../types/aiGeneration.types';

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
  body('parentId')
    .optional({ nullable: true })
    .isInt({ gt: 0 })
    .withMessage('Parent ID, if provided, must be a positive integer'),
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
  check('options')
    .optional()
    .isArray()
    .withMessage('Options, if provided, must be an array'),
  check('options.*')
    .optional()
    .notEmpty()
    .withMessage('Options cannot contain empty strings'),
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
  check('answer')
    .optional()
    .isString()
    .withMessage('Answer must be a string')
    .trim(),
  check('options')
    .optional()
    .isArray()
    .withMessage('Options, if provided, must be an array'),
  handleValidationErrors,
];

export const validateChatWithAI = [
  check('messageContent')
    .notEmpty()
    .withMessage('messageContent cannot be empty')
    .isString()
    .withMessage('messageContent must be a string')
    .trim(),
  check('context')
    .isObject()
    .withMessage('context must be an object'),
  check('context.folderId')
    .optional()
    .isInt({ gt: 0 })
    .withMessage('context.folderId must be a positive integer')
    .toInt(),
  check('context.questionSetId')
    .optional()
    .isInt({ gt: 0 })
    .withMessage('context.questionSetId must be a positive integer')
    .toInt(),
  check('context.noteId')
    .optional()
    .isInt({ gt: 0 })
    .withMessage('context.noteId must be a positive integer')
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
  check('title')
    .notEmpty()
    .withMessage('Question set title is required')
    .isString()
    .withMessage('Question set title must be a string')
    .trim(),
  handleValidationErrors,
];

export const validateQuestionSetUpdate = [
  check('title')
    .notEmpty()
    .withMessage('Question set title is required')
    .isString()
    .withMessage('Question set title must be a string')
    .trim(),
  handleValidationErrors,
];

export const validateGenerateFromSource = [
  check('sourceId')
    .isInt({ min: 1 })
    .withMessage('Source ID must be a positive integer')
    .toInt(),
  check('questionScope')
    .isString()
    .withMessage('Question scope must be a string')
    .notEmpty()
    .withMessage('Question scope cannot be empty'),
  check('questionTone')
    .isString()
    .withMessage('Question tone must be a string')
    .notEmpty()
    .withMessage('Question tone cannot be empty'),
  check('questionCount')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Question count, if provided, must be an integer between 1 and 20')
    .toInt(),
  handleValidationErrors,
];

export const validateNoteCreate = (req: Request, res: Response, next: NextFunction): void => {
  const { title, content, contentBlocks, plainText, folderId, questionSetId } = req.body;

  // Validate title
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    res.status(400).json({ message: 'Title is required and must be a non-empty string' });
    return;
  }

  // Validate content: accept either contentBlocks (preferred) or legacy content string
  if (contentBlocks === undefined && content === undefined) {
    res.status(400).json({ message: 'Either contentBlocks or content is required' });
    return;
  }
  if (contentBlocks !== undefined && typeof contentBlocks !== 'object') {
    res.status(400).json({ message: 'contentBlocks must be a JSON object/array' });
    return;
  }
  if (content !== undefined && typeof content !== 'string') {
    res.status(400).json({ message: 'content must be a string when provided' });
    return;
  }

  // Plain text no longer required

  // Validate folderId if provided
  if (folderId !== undefined && (isNaN(Number(folderId)) || Number(folderId) <= 0)) {
    res.status(400).json({ message: 'Folder ID must be a positive number' });
    return;
  }

  // Ignore questionSetId in schema

  // Allow either folderId or questionSetId for backward compatibility
  if (folderId === undefined && questionSetId === undefined) {
    res.status(400).json({ message: 'Either folderId or questionSetId must be provided' });
    return;
  }

  next();
};

export const validateNoteUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const { title, content, contentBlocks, plainText, folderId, questionSetId } = req.body;

  // Validate title if provided
  if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
    res.status(400).json({ message: 'Title must be a non-empty string' });
    return;
  }

  // Validate content if provided
  if (content !== undefined && typeof content !== 'string') {
    res.status(400).json({ message: 'content must be a string when provided' });
    return;
  }
  if (contentBlocks !== undefined && typeof contentBlocks !== 'object') {
    res.status(400).json({ message: 'contentBlocks must be a JSON object/array' });
    return;
  }

  // Validate plainText if provided
  if (plainText !== undefined && typeof plainText !== 'string') {
    res.status(400).json({ message: 'Plain text must be a string' });
    return;
  }

  // Validate folderId if provided
  if (folderId !== undefined && (isNaN(Number(folderId)) || Number(folderId) <= 0)) {
    res.status(400).json({ message: 'Folder ID must be a positive number' });
    return;
  }

  // Validate questionSetId if provided (for backward compatibility)
  if (questionSetId !== undefined && (isNaN(Number(questionSetId)) || Number(questionSetId) <= 0)) {
    res.status(400).json({ message: 'Question Set ID must be a positive number' });
    return;
  }

  next();
};

export const validateGenerateNote = (req: Request, res: Response, next: NextFunction): void => {
  const { sourceId, userId, noteStyle, sourceFidelity } = req.body;
  if (!sourceId || !userId || !noteStyle || !sourceFidelity) {
    res.status(400).json({ message: 'Missing required fields' });
    return;
  }
  // Validate types or enums if defined
  if (typeof sourceId !== 'string' || typeof userId !== 'number' || typeof noteStyle !== 'string' || typeof sourceFidelity !== 'string') {
    res.status(400).json({ message: 'Invalid field types' });
    return;
  }
  next();
};
