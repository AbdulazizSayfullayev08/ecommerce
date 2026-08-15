import { Router } from 'express';
import { protect, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { productImageUpload } from '../middlewares/upload';
import { UserRole } from '../types';
import {
  createProductController,
  deleteProductController,
  getAdminProducts,
  getFeatured,
  getMyProducts,
  getProduct,
  getProducts,
  setProductActive,
  updateProductController,
  uploadProductImagesController,
} from '../controllers/productController';
import {
  listProductsQuerySchema,
  productSchema,
  updateProductSchema,
} from '../validations/catalogValidation';

const router = Router();

router.get('/', validate(listProductsQuerySchema, 'query'), getProducts);
router.get('/featured', getFeatured);
router.get('/mine', protect, authorize(UserRole.SELLER, UserRole.ADMIN), getMyProducts);
router.get('/admin', protect, authorize(UserRole.ADMIN), getAdminProducts);

router.post('/', protect, validate(productSchema), createProductController);

router.get('/:slug', getProduct);

router.put('/:id', protect, validate(updateProductSchema), updateProductController);
router.patch('/:id/active', protect, validate(updateProductSchema.pick({ isActive: true })), setProductActive);
router.post('/:id/images', protect, productImageUpload.array, uploadProductImagesController);
router.delete('/:id', protect, deleteProductController);

export default router;
