import { Router } from 'express';
import { protect, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { UserRole } from '../types';
import {
  createCouponController,
  deleteCouponController,
  getCoupons,
  updateCouponController,
} from '../controllers/couponController';
import { couponSchema, updateCouponSchema } from '../validations/couponValidation';

const router = Router();

router.use(protect, authorize(UserRole.ADMIN));

router.get('/', getCoupons);
router.post('/', validate(couponSchema), createCouponController);
router.put('/:id', validate(updateCouponSchema), updateCouponController);
router.delete('/:id', deleteCouponController);

export default router;
