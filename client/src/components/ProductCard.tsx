import { Link, useNavigate } from 'react-router-dom'
import type { Product } from '@/types'
import { useCart } from '@/features/cart/CartContext'
import { useAuth } from '@/features/auth/AuthContext'
import { getFileUrl } from '@/utils/fileUrl'
import { formatPrice, getDiscountPercent } from '@/utils/format'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuth()
  const { addItem } = useCart()
  const navigate = useNavigate()
  const image = product.images?.[0]
  const discount = getDiscountPercent(product.price, product.compareAtPrice)
  const category =
    typeof product.category === 'object' ? product.category.name : undefined
  const seller = typeof product.seller === 'object' ? product.seller.name : undefined

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      navigate('/login')
      return
    }
    try {
      await addItem(product._id, 1)
    } catch {
      // ignore — qo'shib bo'lmagan mahsulot
    }
  }

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {image ? (
          <img
            src={getFileUrl(image)}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            Rasm yo'q
          </div>
        )}
        {discount !== null && (
          <span className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
            -{discount}%
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-semibold text-white">
            Tugagan
          </div>
        )}
        {product.stock > 0 && (
          <button
            onClick={(e) => void handleAdd(e)}
            className="absolute bottom-2 right-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow transition-opacity group-hover:opacity-100 hover:bg-indigo-700"
          >
            Savatga
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        {category && <p className="text-xs text-gray-400">{category}</p>}
        <h3 className="line-clamp-2 text-sm font-medium text-gray-800">
          {product.name}
        </h3>
        {seller && <p className="text-xs text-gray-400">Sotuvchi: {seller}</p>}
        <div className="mt-auto pt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-indigo-600">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>
          {product.ratingCount > 0 && (
            <p className="text-xs text-amber-500">
              ★ {product.averageRating.toFixed(1)} ({product.ratingCount})
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
