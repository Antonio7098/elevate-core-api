import { Request, Response, NextFunction } from 'express';
import { plainToInstance, ClassConstructor } from 'class-transformer'; // Using ClassConstructor from class-transformer
import { validate, ValidationError } from 'class-validator';

/**
 * Validation middleware that uses class-transformer and class-validator.
 * @param dtoClass The DTO class to validate against.
 * @param skipMissingProperties If true, skips validating properties that are missing in the input.
 * @param whitelist If true, strips validated object of any properties that do not have any decorators.
 * @param forbidNonWhitelisted If true, instead of stripping non-whitelisted properties, throws an error.
 */
export function validationMiddleware<T extends object>(
  dtoClass: ClassConstructor<T>, 
  skipMissingProperties = false,
  whitelist = true,
  forbidNonWhitelisted = true
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dto = plainToInstance(dtoClass, req.body);
    const errors: ValidationError[] = await validate(dto, { 
      skipMissingProperties, 
      whitelist, 
      forbidNonWhitelisted 
    });

    if (errors.length > 0) {
      const errorMessages = errors.map((error: ValidationError) => {
        // Check if constraints is defined and is an object before calling Object.values
        if (error.constraints && typeof error.constraints === 'object') {
          return Object.values(error.constraints).join(', ');
        }        
        // Handle nested errors if present
        if (error.children && error.children.length > 0) {
          return error.children.map(childError => 
            Object.values(childError.constraints || {}).join(', ')
          ).join('; ');
        }
        return 'Validation error'; // Fallback message
      }).join('; ');
      
      res.status(400).json({ 
        statusCode: 400,
        message: errorMessages,
        error: 'Bad Request'
      });
    } else {
      // Replace req.body with the validated (and potentially transformed) DTO instance
      req.body = dto;
      next();
    }
  };
}
