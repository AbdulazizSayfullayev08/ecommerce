import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { cartApi } from './cartApi'
import { useAuth } from '@/features/auth/AuthContext'
import type { Cart } from '@/types'

interface CartContextValue {
  cart: Cart | null
  itemCount: number
  refreshCart: () => Promise<void>
  addItem: (productId: string, qty?: number) => Promise<void>
  updateQty: (productId: string, qty: number) => Promise<void>
  removeItem: (productId: string) => Promise<void>
  applyCoupon: (code: string) => Promise<void>
  removeCoupon: () => Promise<void>
  clearCart: () => Promise<void>
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [cart, setCart] = useState<Cart | null>(null)

  const refreshCart = useCallback(async () => {
    try {
      const { cart: data } = await cartApi.getCart()
      setCart(data)
    } catch {
      setCart(null)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      setCart(null)
      return
    }
    void refreshCart()
  }, [isAuthenticated, refreshCart])

  const addItem = useCallback(
    async (productId: string, qty = 1) => {
      const { cart: data } = await cartApi.addItem(productId, qty)
      setCart(data)
    },
    [],
  )

  const updateQty = useCallback(async (productId: string, qty: number) => {
    const { cart: data } = await cartApi.updateQty(productId, qty)
    setCart(data)
  }, [])

  const removeItem = useCallback(async (productId: string) => {
    const { cart: data } = await cartApi.removeItem(productId)
    setCart(data)
  }, [])

  const applyCoupon = useCallback(async (code: string) => {
    const { cart: data } = await cartApi.applyCoupon(code)
    setCart(data)
  }, [])

  const removeCoupon = useCallback(async () => {
    const { cart: data } = await cartApi.removeCoupon()
    setCart(data)
  }, [])

  const clearCart = useCallback(async () => {
    const { cart: data } = await cartApi.clearCart()
    setCart(data)
  }, [])

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount: cart?.itemCount ?? 0,
        refreshCart,
        addItem,
        updateQty,
        removeItem,
        applyCoupon,
        removeCoupon,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart CartProvider ichida ishlatilishi kerak')
  }
  return ctx
}
