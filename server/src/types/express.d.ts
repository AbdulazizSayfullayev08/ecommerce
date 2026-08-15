import { UserRole } from '../types';

declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
      user?: {
        userId: string;
        role: UserRole;
      };
    }
  }
}

export {};
