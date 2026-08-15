import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';

export function notFound(_req: Request, _res: Response, next: NextFunction): void {
  next(new ApiError(404, 'Route not found'));
}
