import { apiRequest } from '@/utils/api'
import type { AuthResponse, User } from '@/types'

export interface MessageResponse {
  message: string
}

export interface RegisterResponse {
  user: User
  message: string
}

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    apiRequest<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: data,
    }),

  verifyEmail: (data: { email: string; otp: string }) =>
    apiRequest<RegisterResponse>('/auth/verify-email', {
      method: 'POST',
      body: data,
    }),

  resendOtp: (email: string) =>
    apiRequest<MessageResponse>('/auth/resend-otp', {
      method: 'POST',
      body: { email },
    }),

  login: (data: { email: string; password: string }) =>
    apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: data,
    }),

  refresh: () => apiRequest<AuthResponse>('/auth/refresh', { method: 'POST' }),

  logout: () => apiRequest<MessageResponse>('/auth/logout', { method: 'POST' }),

  getMe: () => apiRequest<{ user: User }>('/auth/me'),

  forgotPassword: (email: string) =>
    apiRequest<MessageResponse>('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    }),

  resetPassword: (data: { token: string; password: string }) =>
    apiRequest<MessageResponse>('/auth/reset-password', {
      method: 'POST',
      body: data,
    }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiRequest<MessageResponse>('/auth/change-password', {
      method: 'POST',
      body: data,
    }),
}
