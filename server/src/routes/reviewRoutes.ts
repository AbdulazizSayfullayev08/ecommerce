import { Router } from 'express';
import { protect } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  createReviewController,
  deleteReviewController,
  listReviewsController,
  updateReviewController,
} from '../controllers/reviewController';
import { createReviewSchema, updateReviewSchema } from '../validations/reviewValidation';

const router = Router({ mergeParams: true });

router.get('/', listReviewsController);
router.post('/', protect, validate(createReviewSchema), createReviewController);
router.patch('/:reviewId', protect, validate(updateReviewSchema), updateReviewController);
router.delete('/:reviewId', protect, deleteReviewController);

export default router;
