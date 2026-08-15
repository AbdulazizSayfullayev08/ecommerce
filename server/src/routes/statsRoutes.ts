import { Router } from 'express';
import { protect, authorize } from '../middlewares/auth';
import { UserRole } from '../types';
import { adminStatsController, sellerStatsController } from '../controllers/statsController';

const router = Router();

router.use(protect);

router.get('/seller', authorize(UserRole.SELLER, UserRole.ADMIN), sellerStatsController);
router.get('/admin', authorize(UserRole.ADMIN), adminStatsController);

export default router;
