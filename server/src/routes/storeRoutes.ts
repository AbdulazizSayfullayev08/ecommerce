import { Router } from 'express';
import { protect, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { storeImageUpload } from '../middlewares/upload';
import { UserRole } from '../types';
import {
  adminStoresController,
  createStoreController,
  listStoresController,
  myStoreController,
  storeBannerController,
  storeBySlugController,
  storeLogoController,
  toggleStoreActiveController,
  updateStoreController,
} from '../controllers/storeController';
import {
  createStoreSchema,
  updateStoreSchema,
} from '../validations/storeValidation';
import { z } from 'zod';

const router = Router();

router.get('/', listStoresController);
router.get('/mine', protect, authorize(UserRole.SELLER, UserRole.ADMIN), myStoreController);
router.get('/admin', protect, authorize(UserRole.ADMIN), adminStoresController);
router.get('/:slug', storeBySlugController);

router.patch(
  '/:id/active',
  protect,
  authorize(UserRole.ADMIN),
  validate(z.object({ isActive: z.boolean() })),
  toggleStoreActiveController
);

router.post('/', protect, authorize(UserRole.SELLER), validate(createStoreSchema), createStoreController);
router.put(
  '/',
  protect,
  authorize(UserRole.SELLER, UserRole.ADMIN),
  validate(updateStoreSchema),
  updateStoreController
);
router.post(
  '/logo',
  protect,
  authorize(UserRole.SELLER, UserRole.ADMIN),
  storeImageUpload.singleField('logo'),
  storeLogoController
);
router.post(
  '/banner',
  protect,
  authorize(UserRole.SELLER, UserRole.ADMIN),
  storeImageUpload.singleField('banner'),
  storeBannerController
);

export default router;
