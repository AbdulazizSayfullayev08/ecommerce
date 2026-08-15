import { Request, Response } from 'express';
import {
  changePassword,
  forgotPassword,
  loginUser,
  logoutUser,
  registerUser,
  resendOtp,
  resetPassword,
  rotateRefreshToken,
  verifyEmail,
} from '../services/authService';
import { asyncHandler } from '../utils/asyncHandler';
import { clearRefreshCookie, setRefreshCookie } from '../utils/cookies';
import { ApiError } from '../utils/ApiError';
import User from '../models/User';

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.userId);
  if (!user) throw new ApiError(404, 'Foydalanuvchi topilmadi');
  res.status(200).json({ success: true, data: { user } });
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const user = await registerUser(req.body);
  res.status(201).json({
    success: true,
    data: {
      user,
      message: 'Ro\'yxatdan o\'tdingiz. Emailingizga yuborilgan OTP kodni kiriting.',
    },
  });
});

export const verifyEmailController = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await verifyEmail(req.body.email, req.body.otp);
    res.status(200).json({
      success: true,
      data: { user, message: 'Email muvaffaqiyatli tasdiqlandi' },
    });
  }
);

export const resendOtpController = asyncHandler(
  async (req: Request, res: Response) => {
    await resendOtp(req.body.email);
    res.status(200).json({
      success: true,
      data: { message: 'Yangi OTP kod emailingizga yuborildi' },
    });
  }
);

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await loginUser(email, password);

  setRefreshCookie(res, refreshToken);
  res.status(200).json({
    success: true,
    data: { user, accessToken },
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token topilmadi');
  }

  const { user, accessToken, refreshToken: newRefreshToken } =
    await rotateRefreshToken(refreshToken);

  setRefreshCookie(res, newRefreshToken);
  res.status(200).json({
    success: true,
    data: { user, accessToken },
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (req.user?.userId) {
    await logoutUser(req.user.userId);
  }
  clearRefreshCookie(res);
  res.status(200).json({ success: true, data: { message: 'Tizimdan chiqdingiz' } });
});

export const forgotPasswordController = asyncHandler(
  async (req: Request, res: Response) => {
    await forgotPassword(req.body.email);
    res.status(200).json({
      success: true,
      data: {
        message: 'Emailingizga parol tiklash havolasi yuborildi (agar email mavjud bo\'lsa)',
      },
    });
  }
);

export const resetPasswordController = asyncHandler(
  async (req: Request, res: Response) => {
    await resetPassword(req.body.token, req.body.password);
    res.status(200).json({
      success: true,
      data: { message: 'Parol muvaffaqiyatli yangilandi' },
    });
  }
);

export const changePasswordController = asyncHandler(
  async (req: Request, res: Response) => {
    await changePassword(
      req.user!.userId,
      req.body.currentPassword,
      req.body.newPassword
    );
    res.status(200).json({
      success: true,
      data: { message: 'Parol muvaffaqiyatli o\'zgartirildi' },
    });
  }
);
