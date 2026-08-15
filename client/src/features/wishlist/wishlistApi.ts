import { apiRequest } from '@/utils/api'
import type { Product } from '@/types'

export const wishlistApi = {
  list: () => apiRequest<{ items: Product[]; total: number }>('/wishlist'),
  ids: () => apiRequest<{ ids: string[] }>('/wishlist/ids'),
  add: (productId: string) =>
    apiRequest<{ added: boolean }>('/wishlist/items', { method: 'POST', body: { productId } }),
  remove: (productId: string) =>
    apiRequest<{ added: boolean }>(`/wishlist/items/${productId}`, { method: 'DELETE' }),
  clear: () => apiRequest<{ message: string }>('/wishlist', { method: 'DELETE' }),
}
