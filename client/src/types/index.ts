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

export interface Address {
  _id: string
  label: string
  fullName: string
  phone: string
  country: string
  region: string
  city: string
  street: string
  zip?: string
  isDefault: boolean
}

export interface User {
  _id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  role: UserRole
  isVerified: boolean
  isApproved: boolean
  isBlocked: boolean
  addresses: Address[]
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  user: User
  accessToken: string
}

export interface PaginatedUsers {
  users: User[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  image?: string
  parent?: string | null
  isActive: boolean
  order: number
  children?: Category[]
}

export interface Product {
  _id: string
  seller: { _id: string; name: string; avatar?: string } | string
  category: { _id: string; name: string; slug: string } | string
  name: string
  slug: string
  description?: string
  brand?: string
  price: number
  compareAtPrice?: number
  stock: number
  sku?: string
  images: string[]
  attributes?: Record<string, string>
  isActive: boolean
  isFeatured: boolean
  averageRating: number
  ratingCount: number
  createdAt: string
  updatedAt: string
}

export interface PaginatedProducts {
  products: Product[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type ProductSort =
  | 'newest'
  | 'oldest'
  | 'price_asc'
  | 'price_desc'
  | 'rating'

export interface ProductFilters {
  q?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  sort?: ProductSort
  page?: number
  limit?: number
}

export interface CartItem {
  product: Product
  qty: number
}

export interface CartTotals {
  subtotal: number
  discount: number
  total: number
}

export interface Cart {
  _id: string
  items: CartItem[]
  couponCode: string | null
  itemCount: number
  totals: CartTotals
}

export interface CartResponse {
  cart: Cart
}
