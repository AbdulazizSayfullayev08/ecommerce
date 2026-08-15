import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';

interface MongoError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}

export function errorHandler(
  err: ApiError | MongoError | Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = 500;
  let message = 'Internal server error';
  let errors: unknown;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = err;
  } else if ((err as MongoError).code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value entered';
    errors = (err as MongoError).keyValue;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid value';
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    if ((err as { code?: string }).code === 'LIMIT_FILE_SIZE') {
      message = 'Fayl hajmi juda katta';
    } else {
      message = 'Fayl yuklashda xatolik yuz berdi';
    }
  } else {
    console.error('[error]', err);
  }

  res.status(statusCode).json({ success: false, message, errors });
}
