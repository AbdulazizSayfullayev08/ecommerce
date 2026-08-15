import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ApiError } from '../utils/ApiError';

export function validate(schema: z.ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      next(new ApiError(400, 'Validatsiya xatosi', errors));
      return;
    }
    req.body = result.data;
    next();
  };
}
