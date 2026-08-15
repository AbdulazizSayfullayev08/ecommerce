import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

const isTest = env.nodeEnv === 'test';

export const authLimiter = isTest
  ? rateLimit({ windowMs: 15 * 60 * 1000, limit: 10000 })
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 50,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: {
        success: false,
        message:
          'Juda ko\'p so\'rov yuborildi. 15 daqiqadan keyin qayta urinib ko\'ring.',
      },
    });

export const strictLimiter = isTest
  ? rateLimit({ windowMs: 15 * 60 * 1000, limit: 10000 })
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 10,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: {
        success: false,
        message: 'Juda ko\'p urinish. 15 daqiqadan keyin qayta urinib ko\'ring.',
      },
    });
