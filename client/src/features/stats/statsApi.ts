import { apiRequest } from '@/utils/api'
import type { AdminStats, SellerStats } from '@/types'

export const statsApi = {
  seller: () => apiRequest<SellerStats>('/stats/seller'),
  admin: () => apiRequest<AdminStats>('/stats/admin'),
}
