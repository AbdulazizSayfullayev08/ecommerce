import { apiRequest } from '@/utils/api'
import type { Product, Store } from '@/types'

export interface StoresResponse {
  stores: Store[]
  total: number
  page: number
  pages: number
}

export interface StoreResponse {
  store: Store
}

export interface StoreDetailResponse {
  store: Store
  products: Product[]
  productCount: number
}

export interface StoreInput {
  name: string
  description?: string
  phone?: string
  address?: string
}

export const storeApi = {
  list: (params?: { q?: string; page?: number }) => {
    const qs = new URLSearchParams()
    if (params?.q) qs.set('q', params.q)
    if (params?.page) qs.set('page', String(params.page))
    const query = qs.toString()
    return apiRequest<StoresResponse>(`/stores${query ? `?${query}` : ''}`)
  },

  getBySlug: (slug: string) =>
    apiRequest<StoreDetailResponse>(`/stores/${slug}`),

  getMine: () => apiRequest<StoreResponse>('/stores/mine'),

  create: (data: StoreInput) =>
    apiRequest<StoreResponse>('/stores', { method: 'POST', body: data }),

  update: (data: Partial<StoreInput> & { isActive?: boolean }) =>
    apiRequest<StoreResponse>('/stores', { method: 'PUT', body: data }),

  uploadLogo: (file: File) => {
    const formData = new FormData()
    formData.append('logo', file)
    return apiRequest<StoreResponse>('/stores/logo', {
      method: 'POST',
      body: formData,
      isFormData: true,
    })
  },

  uploadBanner: (file: File) => {
    const formData = new FormData()
    formData.append('banner', file)
    return apiRequest<StoreResponse>('/stores/banner', {
      method: 'POST',
      body: formData,
      isFormData: true,
    })
  },

  listAdmin: (params?: { q?: string; isActive?: string; page?: number }) => {
    const qs = new URLSearchParams()
    if (params?.q) qs.set('q', params.q)
    if (params?.isActive) qs.set('isActive', params.isActive)
    if (params?.page) qs.set('page', String(params.page))
    const query = qs.toString()
    return apiRequest<{ stores: (Store & { productCount: number })[]; total: number; pages: number }>(
      `/stores/admin${query ? `?${query}` : ''}`,
    )
  },

  toggleActive: (storeId: string, isActive: boolean) =>
    apiRequest<StoreResponse>(`/stores/${storeId}/active`, {
      method: 'PATCH',
      body: { isActive },
    }),
}
