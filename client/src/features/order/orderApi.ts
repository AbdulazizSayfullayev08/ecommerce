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
}
