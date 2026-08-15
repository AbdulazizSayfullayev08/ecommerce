import { apiRequest } from '@/utils/api'
import type { Order } from '@/types'

export interface OrdersResponse {
  orders: Order[]
  total: number
  page: number
  pages: number
}

export const orderApi = {
  listMine: (params?: { page?: number; status?: string }) => {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.status) query.set('status', params.status)
    const qs = query.toString()
    return apiRequest<OrdersResponse>(`/orders/mine${qs ? `?${qs}` : ''}`)
  },

  getMine: (orderId: string) =>
    apiRequest<{ order: Order }>(`/orders/mine/${orderId}`),

  listAdmin: (params?: { page?: number; status?: string; limit?: number }) => {
    const qs = new URLSearchParams()
    if (params?.page) qs.set('page', String(params.page))
    if (params?.status) qs.set('status', params.status)
    if (params?.limit) qs.set('limit', String(params.limit))
    const query = qs.toString()
    return apiRequest<OrdersResponse>(`/orders${query ? `?${query}` : ''}`)
  },

  updateStatus: (orderId: string, status: Order['status']) =>
    apiRequest<{ order: Order }>(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: { status },
    }),
}
