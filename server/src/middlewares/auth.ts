import { NextFunction, Request, Response } from 'express';
import User from '../models/User';
import { verifyAccessToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { UserRole } from '../types';

export const protect = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new ApiError(401, 'Avval tizimga kiring');
    }

    const token = header.split(' ')[1];
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw new ApiError(401, 'Token muddati tugagan yoki noto\'g\'ri');
    }

    const user = await User.findById(payload.userId).select('+isBlocked');
    if (!user) {
      throw new ApiError(401, 'Foydalanuvchi topilmadi');
    }
    if (user.isBlocked) {
      throw new ApiError(403, 'Hisobingiz bloklangan');
    }

    req.user = { userId: user._id.toString(), role: user.role as UserRole };
    next();
  }
);

export const optionalAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      try {
        const payload = verifyAccessToken(header.split(' ')[1]);
        req.user = { userId: payload.userId, role: payload.role };
      } catch {
        // invalid token — treat as guest
      }
    }
    next();
  }
);

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ApiError(401, 'Avval tizimga kiring'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new ApiError(403, 'Bu amal uchun ruxsat yo\'q'));
      return;
    }
    next();
  };
};
