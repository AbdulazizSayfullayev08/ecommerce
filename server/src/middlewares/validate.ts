import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ApiError } from '../utils/ApiError';

export function validate(schema: z.ZodTypeAny, source: 'body' | 'query' = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(source === 'query' ? req.query : req.body);
    if (!result.success) {
      const errors = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      next(new ApiError(400, 'Validatsiya xatosi', errors));
      return;
    }
    if (source === 'query') {
      next();
      return;
    }
    req.body = result.data;
    next();
  };
}
