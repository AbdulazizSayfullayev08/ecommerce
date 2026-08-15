import { Router } from 'express';
import { protect, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { UserRole } from '../types';
import {
  adminOrdersController,
  myOrderController,
  myOrdersController,
  orderStatusController,
  sellerOrdersController,
} from '../controllers/orderController';
import { orderStatusSchema } from '../validations/orderValidation';

const router = Router();

router.use(protect);

router.get('/mine', myOrdersController);
router.get('/mine/:id', myOrderController);

router.get('/seller', authorize(UserRole.SELLER, UserRole.ADMIN), sellerOrdersController);

router.get('/', authorize(UserRole.ADMIN), adminOrdersController);
router.patch(
  '/:id/status',
  authorize(UserRole.ADMIN),
  validate(orderStatusSchema),
  orderStatusController
);

export default router;
