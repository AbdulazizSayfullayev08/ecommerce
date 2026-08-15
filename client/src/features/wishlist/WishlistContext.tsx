import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import { wishlistApi } from './wishlistApi'

interface WishlistContextValue {
  ids: string[]
  count: number
  has: (productId: string) => boolean
  toggle: (productId: string) => Promise<boolean>
  remove: (productId: string) => Promise<void>
  clear: () => Promise<void>
  refresh: () => Promise<void>
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [ids, setIds] = useState<string[]>([])

  const refresh = useCallback(async () => {
    try {
      const data = await wishlistApi.ids()
      setIds(data.ids)
    } catch {
      setIds([])
    }
  }, [])

  useEffect(() => {
    if (user) {
      void refresh()
    } else {
      setIds([])
    }
  }, [user, refresh])

  const has = useCallback((productId: string) => ids.includes(productId), [ids])

  const toggle = useCallback(
    async (productId: string) => {
      if (has(productId)) {
        await wishlistApi.remove(productId)
        setIds((prev) => prev.filter((id) => id !== productId))
        return false
      }
      await wishlistApi.add(productId)
      setIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]))
      return true
    },
    [has],
  )

  const remove = useCallback(async (productId: string) => {
    await wishlistApi.remove(productId)
    setIds((prev) => prev.filter((id) => id !== productId))
  }, [])

  const clear = useCallback(async () => {
    await wishlistApi.clear()
    setIds([])
  }, [])

  return (
    <WishlistContext.Provider
      value={{ ids, count: ids.length, has, toggle, remove, clear, refresh }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext)
  if (!ctx) {
    throw new Error('useWishlist WishlistProvider ichida ishlatilishi kerak')
  }
  return ctx
}
