import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { storeApi } from '@/features/store/storeApi'
import { ProductCard } from '@/components/ProductCard'
import { Alert } from '@/components/ui/Alert'
import type { Product, Store as StoreType } from '@/types'
import { getFileUrl } from '@/utils/fileUrl'

export default function StorePage() {
  const { slug } = useParams<{ slug: string }>()
  const [store, setStore] = useState<StoreType | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [productCount, setProductCount] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) return
    void (async () => {
      try {
        const data = await storeApi.getBySlug(slug)
        setStore(data.store)
        setProducts(data.products)
        setProductCount(data.productCount)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Do\'kon topilmadi')
      }
    })()
  }, [slug])

  if (error) {
    return (
      <div className="mx-auto max-w-3xl py-16">
        <Alert type="error" message={error} />
      </div>
    )
  }

  if (!store) {
    return <p className="py-16 text-center text-gray-400">Yuklanmoqda...</p>
  }

  const owner = typeof store.owner === 'object' ? store.owner : undefined

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
        {store.banner && (
          <img
            src={getFileUrl(store.banner)}
            alt={store.name}
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
        )}
        <div className="relative flex items-center gap-4 p-6 sm:p-8">
          {store.logo ? (
            <img
              src={getFileUrl(store.logo)}
              alt={store.name}
              className="h-20 w-20 rounded-2xl object-cover shadow"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 text-3xl font-bold">
              {store.name.slice(0, 1)}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{store.name}</h1>
            <p className="mt-1 text-sm text-white/80">
              {productCount} ta mahsulot{owner ? ` · ${owner.name}` : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>

      {products.length === 0 && (
        <p className="py-12 text-center text-gray-500">
          Bu do'konda hozircha mahsulotlar yo'q.
        </p>
      )}
    </div>
  )
}
