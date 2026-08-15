import { Request, Response } from 'express';
import {
  addAddress,
  applySeller,
  approveSeller,
  blockUser,
  changeRole,
  deleteAddress,
  listAddresses,
  listUsers,
  setDefaultAddress,
  updateAddress,
  updateProfile,
  uploadAvatar,
} from '../services/userService';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

const param = (req: Request, name: string): string => req.params[name] as string;

export const updateProfileController = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await updateProfile(req.user!.userId, req.body);
    res.status(200).json({ success: true, data: { user } });
  }
);

export const uploadAvatarController = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await uploadAvatar(req.user!.userId, req.file);
    res.status(200).json({ success: true, data: { user } });
  }
);

export const getAddresses = asyncHandler(async (req: Request, res: Response) => {
  const addresses = await listAddresses(req.user!.userId);
  res.status(200).json({ success: true, data: { addresses } });
});

export const createAddress = asyncHandler(async (req: Request, res: Response) => {
  const addresses = await addAddress(req.user!.userId, req.body);
  res.status(201).json({ success: true, data: { addresses } });
});

export const editAddress = asyncHandler(async (req: Request, res: Response) => {
  const addresses = await updateAddress(
    req.user!.userId,
    param(req, 'addressId'),
    req.body
  );
  res.status(200).json({ success: true, data: { addresses } });
});

export const removeAddress = asyncHandler(async (req: Request, res: Response) => {
  const addresses = await deleteAddress(req.user!.userId, param(req, 'addressId'));
  res.status(200).json({ success: true, data: { addresses } });
});

export const makeDefaultAddress = asyncHandler(async (req: Request, res: Response) => {
  const addresses = await setDefaultAddress(req.user!.userId, param(req, 'addressId'));
  res.status(200).json({ success: true, data: { addresses } });
});

export const sellerApplication = asyncHandler(async (req: Request, res: Response) => {
  const user = await applySeller(req.user!.userId);
  res.status(200).json({
    success: true,
    data: { user, message: 'Arizo yuborildi. Admin tasdiqlashini kuting' },
  });
});

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await listUsers({
    search: req.query.search as string | undefined,
    role: req.query.role as never,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  res.status(200).json({ success: true, data: result });
});

export const setRole = asyncHandler(async (req: Request, res: Response) => {
  if (param(req, 'id') === req.user!.userId) {
    throw new ApiError(400, 'O\'z rolingizni o\'zgartira olmaysiz');
  }
  const user = await changeRole(param(req, 'id'), req.body.role);
  res.status(200).json({ success: true, data: { user } });
});

export const setBlock = asyncHandler(async (req: Request, res: Response) => {
  if (param(req, 'id') === req.user!.userId) {
    throw new ApiError(400, 'O\'zingizni bloklay olmaysiz');
  }
  const user = await blockUser(param(req, 'id'), req.body.isBlocked);
  res.status(200).json({ success: true, data: { user } });
});

export const setApprove = asyncHandler(async (req: Request, res: Response) => {
  const user = await approveSeller(param(req, 'id'), req.body.isApproved);
  res.status(200).json({ success: true, data: { user } });
});
