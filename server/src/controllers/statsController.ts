import { Request, Response, NextFunction } from 'express';
import { getSellerStats, getAdminStats } from '../services/statsService';

export async function sellerStatsController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getSellerStats(req.user!.userId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function adminStatsController(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getAdminStats();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
