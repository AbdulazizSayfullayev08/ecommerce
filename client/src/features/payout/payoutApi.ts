import { apiRequest } from '@/utils/api'
import type { PaginatedPayouts, Payout, PayoutSummary } from '@/types'

export const payoutApi = {
  summary: () => apiRequest<PayoutSummary>('/payouts/summary'),

  request: (amount: number) =>
    apiRequest<{ payout: Payout }>('/payouts', { method: 'POST', body: { amount } }),

  listAdmin: (params?: { status?: string; page?: number }) => {
    const qs = new URLSearchParams()
    if (params?.status) qs.set('status', params.status)
    if (params?.page) qs.set('page', String(params.page))
    const query = qs.toString()
    return apiRequest<PaginatedPayouts>(`/payouts${query ? `?${query}` : ''}`)
  },

  handle: (id: string, status: 'paid' | 'rejected') =>
    apiRequest<{ payout: Payout }>(`/payouts/${id}`, { method: 'PATCH', body: { status } }),
}
