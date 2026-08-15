import { apiRequest } from '@/utils/api'
import type { PaginatedReviews, Review } from '@/types'

export const reviewApi = {
  list: (productId: string, params?: { page?: number }) => {
    const qs = params?.page ? `?page=${params.page}` : ''
    return apiRequest<PaginatedReviews>(`/products/${productId}/reviews${qs}`)
  },

  create: (productId: string, data: { rating: number; comment?: string }) =>
    apiRequest<{ review: Review }>(`/products/${productId}/reviews`, {
      method: 'POST',
      body: data,
    }),

  update: (productId: string, reviewId: string, data: { rating: number; comment?: string }) =>
    apiRequest<{ review: Review }>(`/products/${productId}/reviews/${reviewId}`, {
      method: 'PATCH',
      body: data,
    }),

  remove: (productId: string, reviewId: string) =>
    apiRequest<{ message: string }>(`/products/${productId}/reviews/${reviewId}`, {
      method: 'DELETE',
    }),
}
