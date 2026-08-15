import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    res.status(200).json({
      success: true,
      data: {
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    });
  })
);

export default router;
