import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Ism kamida 2 ta belgi bo\'lishi kerak')
    .max(50, 'Ism 50 ta belgidan oshmasligi kerak'),
  email: z.string().email('Noto\'g\'ri email format'),
  password: z
    .string()
    .min(8, 'Parol kamida 8 ta belgi bo\'lishi kerak')
    .max(100, 'Parol juda uzun'),
});

export const loginSchema = z.object({
  email: z.string().email('Noto\'g\'ri email format'),
  password: z.string().min(1, 'Parol kiritilishi shart'),
});

export const verifyEmailSchema = z.object({
  email: z.string().email('Noto\'g\'ri email format'),
  otp: z.string().length(6, 'OTP 6 ta raqam bo\'lishi kerak'),
});

export const resendOtpSchema = z.object({
  email: z.string().email('Noto\'g\'ri email format'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Noto\'g\'ri email format'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Token noto\'g\'ri'),
  password: z
    .string()
    .min(8, 'Parol kamida 8 ta belgi bo\'lishi kerak')
    .max(100, 'Parol juda uzun'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Joriy parol kiritilishi shart'),
  newPassword: z
    .string()
    .min(8, 'Yangi parol kamida 8 ta belgi bo\'lishi kerak')
    .max(100, 'Parol juda uzun'),
});
