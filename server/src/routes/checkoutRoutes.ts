import { Router } from 'express';
import { protect } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  codCheckoutController,
  stripeCheckoutController,
  webhookController,
} from '../controllers/checkoutController';
import { checkoutSchema } from '../validations/checkoutValidation';

const router = Router();

router.post('/webhook', webhookController);

router.post('/', protect, validate(checkoutSchema), stripeCheckoutController);
router.post('/cod', protect, validate(checkoutSchema), codCheckoutController);

export default router;
