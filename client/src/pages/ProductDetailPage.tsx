import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { catalogApi } from '@/features/catalog/catalogApi'
import { useAuth } from '@/features/auth/AuthContext'
import { Alert } from '@/components/ui/Alert'
import type { Product } from '@/types'
import { getFileUrl } from '@/utils/fileUrl'
import { formatPrice, getDiscountPercent } from '@/utils/format'

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [imageIndex, setImageIndex] = useState(0)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    setIsLoading(true)
    setError('')
    setImageIndex(0)
    catalogApi
      .getProduct(slug)
      .then((res) => setProduct(res.product))
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Mahsulot topilmadi'),
      )
      .finally(() => setIsLoading(false))
  }, [slug])

  if (isLoading) {
    return <p className="py-16 text-center text-gray-400">Yuklanmoqda...</p>
  }

  if (!product || error) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <Alert type="error" message={error || 'Mahsulot topilmadi'} />
        <Link to="/products" className="text-indigo-600 hover:underline">
          ← Mahsulotlarga qaytish
        </Link>
      </div>
    )
  }

  const discount = getDiscountPercent(product.price, product.compareAtPrice)
  const category =
    typeof product.category === 'object' ? product.category : undefined
  const seller = typeof product.seller === 'object' ? product.seller : undefined
  const isOut = product.stock === 0

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <div className="aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
          {product.images[imageIndex] ? (
            <img
              src={getFileUrl(product.images[imageIndex])}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">
              Rasm yo'q
            </div>
          )}
        </div>
        {product.images.length > 1 && (
          <div className="mt-3 flex gap-2">
            {product.images.map((img, i) => (
              <button
                key={img}
                onClick={() => setImageIndex(i)}
                className={`h-20 w-20 overflow-hidden rounded-lg border ${
                  i === imageIndex
                    ? 'border-indigo-500'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <img
                  src={getFileUrl(img)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          {category && (
            <Link
              to={`/products?category=${category.slug}`}
              className="text-sm text-indigo-600 hover:underline"
            >
              {category.name}
            </Link>
          )}
          <h1 className="text-2xl font-bold">{product.name}</h1>
          {product.brand && <p className="text-sm text-gray-500">{product.brand}</p>}
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold text-indigo-600">
            {formatPrice(product.price)}
          </span>
          {discount !== null && (
            <>
              <span className="text-lg text-gray-400 line-through">
                {formatPrice(product.compareAtPrice!)}
              </span>
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-sm font-semibold text-red-600">
                -{discount}%
              </span>
            </>
          )}
        </div>

        <p className="text-sm">
          {isOut ? (
            <span className="font-medium text-red-500">Mavjud emas</span>
          ) : (
            <span className="font-medium text-green-600">
              Omborda: {product.stock} dona
            </span>
          )}
        </p>

        {user ? (
          <button
            disabled={isOut}
            className="w-full rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            Savatga qo'shish
          </button>
        ) : (
          <Link
            to="/login"
            className="inline-block rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Savatga qo'shish uchun kiring
          </Link>
        )}

        {product.description && (
          <div className="rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-700">Tavsif</h2>
            <p className="mt-1 whitespace-pre-line text-sm text-gray-600">
              {product.description}
            </p>
          </div>
        )}

        {product.attributes && Object.keys(product.attributes).length > 0 && (
          <div className="rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-700">Xususiyatlar</h2>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {Object.entries(product.attributes).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <dt className="text-gray-500">{k}</dt>
                  <dd className="font-medium text-gray-800">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {seller && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {seller.avatar && (
              <img
                src={getFileUrl(seller.avatar)}
                alt=""
                className="h-8 w-8 rounded-full object-cover"
              />
            )}
            <span>
              Sotuvchi:{' '}
              <Link
                to={`/seller/${seller._id}`}
                className="font-medium text-indigo-600 hover:underline"
              >
                {seller.name}
              </Link>
            </span>
          </div>
        )}

        {product.ratingCount > 0 && (
          <p className="text-sm text-amber-500">
            Reyting: ★ {product.averageRating.toFixed(1)} ({product.ratingCount}{' '}
            baho)
          </p>
        )}
      </div>
    </div>
  )
}
