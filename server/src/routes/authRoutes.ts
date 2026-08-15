import { Router } from 'express';
import {
  changePasswordController,
  forgotPasswordController,
  getMe,
  login,
  logout,
  refresh,
  register,
  resendOtpController,
  resetPasswordController,
  verifyEmailController,
} from '../controllers/authController';
import { protect } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { authLimiter, strictLimiter } from '../middlewares/rateLimiter';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendOtpSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validations/authValidation';

const router = Router();

router.post('/register', strictLimiter, validate(registerSchema), register);
router.post('/verify-email', strictLimiter, validate(verifyEmailSchema), verifyEmailController);
router.post('/resend-otp', strictLimiter, validate(resendOtpSchema), resendOtpController);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', authLimiter, refresh);
router.post('/logout', protect, logout);
router.post('/forgot-password', strictLimiter, validate(forgotPasswordSchema), forgotPasswordController);
router.post('/reset-password', strictLimiter, validate(resetPasswordSchema), resetPasswordController);
router.post('/change-password', protect, validate(changePasswordSchema), changePasswordController);
router.get('/me', protect, getMe);

export default router;
