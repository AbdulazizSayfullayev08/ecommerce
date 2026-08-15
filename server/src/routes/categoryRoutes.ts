import { Router } from 'express';
import { protect, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { UserRole } from '../types';
import {
  createCategoryController,
  deleteCategoryController,
  getCategories,
  getCategory,
  updateCategoryController,
} from '../controllers/categoryController';
import { categorySchema } from '../validations/catalogValidation';

const router = Router();

router.get('/', getCategories);
router.get('/:slug', getCategory);

router.post('/', protect, authorize(UserRole.ADMIN), validate(categorySchema), createCategoryController);
router.put('/:id', protect, authorize(UserRole.ADMIN), validate(categorySchema), updateCategoryController);
router.delete('/:id', protect, authorize(UserRole.ADMIN), deleteCategoryController);

export default router;
