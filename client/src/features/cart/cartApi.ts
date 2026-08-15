import { apiRequest } from '@/utils/api'
import type { CartResponse } from '@/types'

export const cartApi = {
  getCart: () => apiRequest<CartResponse>('/cart'),

  addItem: (productId: string, qty = 1) =>
    apiRequest<CartResponse>('/cart/items', {
      method: 'POST',
      body: { productId, qty },
    }),

  updateQty: (productId: string, qty: number) =>
    apiRequest<CartResponse>(`/cart/items/${productId}`, {
      method: 'PATCH',
      body: { qty },
    }),

  removeItem: (productId: string) =>
    apiRequest<CartResponse>(`/cart/items/${productId}`, { method: 'DELETE' }),

  clearCart: () => apiRequest<CartResponse>('/cart', { method: 'DELETE' }),

  applyCoupon: (code: string) =>
    apiRequest<CartResponse>('/cart/coupon', {
      method: 'POST',
      body: { code },
    }),

  removeCoupon: () =>
    apiRequest<CartResponse>('/cart/coupon', { method: 'DELETE' }),
}
