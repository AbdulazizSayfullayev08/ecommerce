import { apiRequest } from '@/utils/api'
import type { Address, PaginatedUsers, User, UserRole } from '@/types'

export interface MessageResponse {
  message: string
}

export interface UserResponse {
  user: User
}

export interface AddressesResponse {
  addresses: Address[]
}

export interface AddressInput {
  label?: string
  fullName: string
  phone: string
  country?: string
  region: string
  city: string
  street: string
  zip?: string
  isDefault?: boolean
}

export const userApi = {
  updateProfile: (data: { name?: string; phone?: string }) =>
    apiRequest<UserResponse>('/users/me', { method: 'PATCH', body: data }),

  uploadAvatar: (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return apiRequest<UserResponse>('/users/me/avatar', {
      method: 'POST',
      body: formData,
      isFormData: true,
    })
  },

  getAddresses: () => apiRequest<AddressesResponse>('/users/me/addresses'),

  addAddress: (data: AddressInput) =>
    apiRequest<AddressesResponse>('/users/me/addresses', {
      method: 'POST',
      body: data,
    }),

  updateAddress: (addressId: string, data: AddressInput) =>
    apiRequest<AddressesResponse>(`/users/me/addresses/${addressId}`, {
      method: 'PUT',
      body: data,
    }),

  deleteAddress: (addressId: string) =>
    apiRequest<AddressesResponse>(`/users/me/addresses/${addressId}`, {
      method: 'DELETE',
    }),

  setDefaultAddress: (addressId: string) =>
    apiRequest<AddressesResponse>(`/users/me/addresses/${addressId}/default`, {
      method: 'PATCH',
    }),

  applySeller: () =>
    apiRequest<UserResponse & MessageResponse>('/users/me/seller-application', {
      method: 'POST',
    }),

  listUsers: (params: { search?: string; role?: UserRole; page?: number } = {}) => {
    const qs = new URLSearchParams()
    if (params.search) qs.set('search', params.search)
    if (params.role) qs.set('role', params.role)
    if (params.page) qs.set('page', String(params.page))
    const query = qs.toString()
    return apiRequest<PaginatedUsers>(`/users${query ? `?${query}` : ''}`)
  },

  changeRole: (userId: string, role: UserRole) =>
    apiRequest<UserResponse>(`/users/${userId}/role`, {
      method: 'PATCH',
      body: { role },
    }),

  setBlocked: (userId: string, isBlocked: boolean) =>
    apiRequest<UserResponse>(`/users/${userId}/block`, {
      method: 'PATCH',
      body: { isBlocked },
    }),

  setApproved: (userId: string, isApproved: boolean) =>
    apiRequest<UserResponse>(`/users/${userId}/approve`, {
      method: 'PATCH',
      body: { isApproved },
    }),
}
