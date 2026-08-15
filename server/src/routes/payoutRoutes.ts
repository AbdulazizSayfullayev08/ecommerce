import { Router } from 'express';
import { protect, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { UserRole } from '../types';
import {
  handlePayoutController,
  listPayoutsController,
  requestPayoutController,
  summaryController,
} from '../controllers/payoutController';
import { payoutStatusSchema, requestPayoutSchema } from '../validations/payoutValidation';

const router = Router();

router.use(protect);

router.get('/summary', authorize(UserRole.SELLER, UserRole.ADMIN), summaryController);
router.post('/', authorize(UserRole.SELLER), validate(requestPayoutSchema), requestPayoutController);

router.get('/', authorize(UserRole.ADMIN), listPayoutsController);
router.patch(
  '/:id',
  authorize(UserRole.ADMIN),
  validate(payoutStatusSchema),
  handlePayoutController
);

export default router;
