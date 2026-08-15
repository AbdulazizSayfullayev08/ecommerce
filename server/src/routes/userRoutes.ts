import { Router } from 'express';
import { protect, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { uploadAvatar } from '../middlewares/upload';
import { UserRole } from '../types';
import {
  createAddress,
  editAddress,
  getAddresses,
  getUsers,
  makeDefaultAddress,
  removeAddress,
  sellerApplication,
  setApprove,
  setBlock,
  setRole,
  updateProfileController,
  uploadAvatarController,
} from '../controllers/userController';
import {
  addressSchema,
  approveSchema,
  blockSchema,
  listUsersSchema,
  roleSchema,
  updateProfileSchema,
} from '../validations/userValidation';

const router = Router();

router.use(protect);

router.patch('/me', validate(updateProfileSchema), updateProfileController);
router.post('/me/avatar', uploadAvatar.single('avatar'), uploadAvatarController);

router.get('/me/addresses', getAddresses);
router.post('/me/addresses', validate(addressSchema), createAddress);
router.put('/me/addresses/:addressId', validate(addressSchema), editAddress);
router.delete('/me/addresses/:addressId', removeAddress);
router.patch('/me/addresses/:addressId/default', makeDefaultAddress);

router.post('/me/seller-application', sellerApplication);

router.get('/', authorize(UserRole.ADMIN), validate(listUsersSchema, 'query'), getUsers);
router.patch('/:id/role', authorize(UserRole.ADMIN), validate(roleSchema), setRole);
router.patch('/:id/block', authorize(UserRole.ADMIN), validate(blockSchema), setBlock);
router.patch('/:id/approve', authorize(UserRole.ADMIN), validate(approveSchema), setApprove);

export default router;
