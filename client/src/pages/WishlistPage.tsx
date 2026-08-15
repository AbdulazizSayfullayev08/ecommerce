import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWishlist } from '@/features/wishlist/WishlistContext'
import { wishlistApi } from '@/features/wishlist/wishlistApi'
import { ProductCard } from '@/components/ProductCard'
import { Alert } from '@/components/ui/Alert'
import type { Product } from '@/types'

export default function WishlistPage() {
  const { ids, remove, clear } = useWishlist()
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (ids.length === 0) {
      setProducts([])
      return
    }
    let cancelled = false
    setError('')
    void (async () => {
      try {
        const data = await wishlistApi.list()
        if (!cancelled) setProducts(data.items)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Yuklanmadi')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [ids])

  const handleRemove = async (productId: string) => {
    setError('')
    setBusy(true)
    try {
      await remove(productId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setBusy(false)
    }
  }

  const handleClear = async () => {
    setError('')
    try {
      await clear()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    }
  }

  if (ids.length === 0) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <p className="text-lg font-medium text-gray-600">Sevimlilar bo\'sh</p>
        <p className="mt-2 text-sm text-gray-400">
          Mahsulotlarni yurak belgisi orqali sevimlilarga qo\'shing
        </p>
        <Link
          to="/products"
          className="mt-4 inline-block rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Mahsulotlarga o\'tish
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sevimlilar</h1>
        <button
          onClick={() => void handleClear()}
          className="text-sm font-medium text-red-500 hover:underline"
        >
          Hammasini tozalash
        </button>
      </div>

      {error && <div className="mt-3"><Alert type="error" message={error} /></div>}

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {products.map((p) => (
          <div key={p._id} className="relative">
            <ProductCard product={p} />
            <button
              onClick={() => void handleRemove(p._id)}
              disabled={busy}
              className="absolute right-2 top-9 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-red-500 shadow hover:bg-white disabled:opacity-50"
            >
              O\'chirish
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
