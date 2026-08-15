export interface ApiSuccess<T> {
  success: true
  data: T
}

export interface ApiFailure {
  success: false
  message: string
  errors?: unknown
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure

export const UserRole = {
  CUSTOMER: 'customer',
  SELLER: 'seller',
  ADMIN: 'admin',
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export interface HealthData {
  status: string
  uptime: number
  timestamp: string
}

export interface User {
  _id: string
  name: string
  email: string
  avatar?: string
  role: UserRole
  isVerified: boolean
  isApproved: boolean
  isBlocked: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  user: User
  accessToken: string
}
