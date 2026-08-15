import { Router } from 'express';
import { protect } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  addItemController,
  applyCouponController,
  clearCartController,
  getCartController,
  removeCouponController,
  removeItemController,
  updateQtyController,
} from '../controllers/cartController';
import {
  addItemSchema,
  applyCouponSchema,
  updateQtySchema,
} from '../validations/cartValidation';

const router = Router();

router.use(protect);

router.get('/', getCartController);
router.delete('/', clearCartController);
router.post('/items', validate(addItemSchema), addItemController);
router.patch('/items/:productId', validate(updateQtySchema), updateQtyController);
router.delete('/items/:productId', removeItemController);
router.post('/coupon', validate(applyCouponSchema), applyCouponController);
router.delete('/coupon', removeCouponController);

export default router;
