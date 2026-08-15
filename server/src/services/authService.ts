import User from '../models/User';
import { ApiError } from '../utils/ApiError';
import { generateOtp, generateToken } from '../utils/token';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { sendEmail } from '../utils/email';
import { env } from '../config/env';
import { UserRole } from '../types';

const OTP_EXPIRES_MIN = 10;
const RESET_EXPIRES_HOURS = 1;

function otpEmailTemplate(otp: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:20px;border:1px solid #e5e7eb;border-radius:12px;">
      <h2 style="color:#4f46e5;">Do'kon — Email tasdiqlash</h2>
      <p>Salom! Ro'yxatdan o'tishni yakunlash uchun quyidagi kodni kiriting:</p>
      <div style="font-size:28px;font-weight:bold;letter-spacing:6px;text-align:center;padding:16px;background:#eef2ff;border-radius:8px;color:#4f46e5;">${otp}</div>
      <p style="color:#6b7280;font-size:13px;">Kod 10 daqiqa amal qiladi. Agar bu so'rov sizdan bo'lmasa, xabarni e'tiborsiz qoldiring.</p>
    </div>
  `;
}

function resetEmailTemplate(resetUrl: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:20px;border:1px solid #e5e7eb;border-radius:12px;">
      <h2 style="color:#4f46e5;">Do'kon — Parolni tiklash</h2>
      <p>Parolingizni tiklash uchun quyidagi tugmani bosing:</p>
      <a href="${resetUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:8px 0;">Parolni tiklash</a>
      <p style="color:#6b7280;font-size:13px;">Havola 1 soat amal qiladi. Agar siz so'ramagan bo'lsangiz, bu xabarni e'tiborsiz qoldiring.</p>
    </div>
  `;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export async function registerUser(input: RegisterInput) {
  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) {
    if (!existing.isVerified && existing.otpExpiresAt) {
      throw new ApiError(409, 'Bu email allaqachon ro\'yxatdan o\'tgan. OTP tasdiqlang.', {
        resendOtp: true,
      });
    }
    throw new ApiError(409, 'Bu email allaqachon ro\'yxatdan o\'tgan');
  }

  const user = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    password: input.password,
    role: input.role ?? UserRole.CUSTOMER,
  });

  const otp = generateOtp();
  user.otp = otp;
  user.otpExpiresAt = new Date(Date.now() + OTP_EXPIRES_MIN * 60 * 1000);
  await user.save();

  try {
    await sendEmail({
      to: user.email,
      subject: 'Email tasdiqlash kodi',
      html: otpEmailTemplate(otp),
    });
  } catch (err) {
    console.error('[email] OTP yuborilmadi:', err);
  }
  console.log(`[dev] OTP for ${user.email}: ${otp}`);

  return user;
}

export async function verifyEmail(email: string, otp: string) {
  const user = await User.findOne({
    email: email.toLowerCase(),
  }).select('+otp +otpExpiresAt');

  if (!user) throw new ApiError(404, 'Foydalanuvchi topilmadi');
  if (user.isVerified) throw new ApiError(400, 'Email allaqachon tasdiqlangan');

  if (!user.otp || user.otp !== otp) {
    throw new ApiError(400, 'Noto\'g\'ri OTP kodi');
  }
  if (!user.otpExpiresAt || user.otpExpiresAt.getTime() < Date.now()) {
    throw new ApiError(400, 'OTP muddati tugagan');
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiresAt = undefined;
  await user.save();

  return user;
}

export async function resendOtp(email: string) {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+otp +otpExpiresAt'
  );
  if (!user) throw new ApiError(404, 'Foydalanuvchi topilmadi');
  if (user.isVerified) throw new ApiError(400, 'Email allaqachon tasdiqlangan');

  const otp = generateOtp();
  user.otp = otp;
  user.otpExpiresAt = new Date(Date.now() + OTP_EXPIRES_MIN * 60 * 1000);
  await user.save();

  try {
    await sendEmail({
      to: user.email,
      subject: 'Email tasdiqlash kodi (qayta)',
      html: otpEmailTemplate(otp),
    });
  } catch (err) {
    console.error('[email] OTP yuborilmadi:', err);
  }
  console.log(`[dev] OTP for ${user.email}: ${otp}`);
}

export async function loginUser(email: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+password +refreshToken +isBlocked +isVerified'
  );
  if (!user) throw new ApiError(401, 'Email yoki parol noto\'g\'ri');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new ApiError(401, 'Email yoki parol noto\'g\'ri');
  if (user.isBlocked) throw new ApiError(403, 'Hisobingiz bloklangan');
  if (!user.isVerified) {
    throw new ApiError(403, 'Email tasdiqlanmagan. Avval emailingizni tasdiqlang', {
      needsVerification: true,
    });
  }

  const tokens = await issueTokens(user._id.toString(), user.role as UserRole);
  return { user, ...tokens };
}

export async function rotateRefreshToken(oldRefreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(oldRefreshToken);
  } catch {
    throw new ApiError(401, 'Refresh token noto\'g\'ri yoki muddati tugagan');
  }

  const user = await User.findById(payload.userId).select(
    '+refreshToken +isBlocked +isVerified'
  );
  if (!user) throw new ApiError(401, 'Foydalanuvchi topilmadi');
  if (user.isBlocked) throw new ApiError(403, 'Hisobingiz bloklangan');

  if (!user.refreshToken || user.refreshToken !== oldRefreshToken) {
    throw new ApiError(401, 'Refresh token noto\'g\'ri yoki qayta ishlatilgan');
  }

  const tokens = await issueTokens(user._id.toString(), user.role as UserRole);
  return { user, ...tokens };
}

async function issueTokens(userId: string, role: UserRole) {
  const refreshToken = signRefreshToken({ userId, tokenVersion: Date.now().toString() });
  await User.findByIdAndUpdate(userId, { refreshToken });
  return {
    accessToken: signAccessToken({ userId, role }),
    refreshToken,
  };
}

export async function logoutUser(userId: string) {
  await User.findByIdAndUpdate(userId, { refreshToken: undefined });
}

export async function forgotPassword(email: string) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new ApiError(404, 'Bu email bilan foydalanuvchi topilmadi');

  const token = generateToken(32);
  user.resetToken = token;
  user.resetTokenExpiresAt = new Date(
    Date.now() + RESET_EXPIRES_HOURS * 60 * 60 * 1000
  );
  await user.save();

  const resetUrl = `${env.clientUrl}/reset-password?token=${token}`;
  try {
    await sendEmail({
      to: user.email,
      subject: 'Parolni tiklash',
      html: resetEmailTemplate(resetUrl),
    });
  } catch (err) {
    console.error('[email] Reset email yuborilmadi:', err);
  }
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await User.findOne({ resetToken: token }).select(
    '+resetToken +resetTokenExpiresAt'
  );
  if (!user) throw new ApiError(400, 'Token noto\'g\'ri');
  if (!user.resetTokenExpiresAt || user.resetTokenExpiresAt.getTime() < Date.now()) {
    throw new ApiError(400, 'Token muddati tugagan');
  }

  user.password = newPassword;
  user.resetToken = undefined;
  user.resetTokenExpiresAt = undefined;
  user.refreshToken = undefined;
  user.isVerified = true;
  await user.save();
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new ApiError(404, 'Foydalanuvchi topilmadi');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new ApiError(400, 'Joriy parol noto\'g\'ri');

  user.password = newPassword;
  await user.save();
}
