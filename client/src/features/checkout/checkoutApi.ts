import { apiRequest } from '@/utils/api'
import type { Order } from '@/types'

export interface CheckoutStripeResponse {
  url: string
  orderNumber: string
}

export interface CheckoutCodResponse {
  order: Order
}

export const checkoutApi = {
  stripe: (addressId: string) =>
    apiRequest<CheckoutStripeResponse>('/checkout', {
      method: 'POST',
      body: { addressId },
    }),

  cod: (addressId: string) =>
    apiRequest<CheckoutCodResponse>('/checkout/cod', {
      method: 'POST',
      body: { addressId },
    }),
}
