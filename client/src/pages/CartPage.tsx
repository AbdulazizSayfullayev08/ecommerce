import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '@/features/cart/CartContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { getFileUrl } from '@/utils/fileUrl'
import { formatPrice } from '@/utils/format'

export default function CartPage() {
  const { cart, updateQty, removeItem, applyCoupon, removeCoupon, clearCart } =
    useCart()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [couponError, setCouponError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleQty = async (productId: string, qty: number) => {
    setError('')
    try {
      await updateQty(productId, qty)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    }
  }

  const handleRemove = async (productId: string) => {
    setError('')
    try {
      await removeItem(productId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    }
  }

  const handleCoupon = async (e: FormEvent) => {
    e.preventDefault()
    setCouponError('')
    setBusy(true)
    try {
      await applyCoupon(code)
      setCode('')
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setBusy(false)
    }
  }

  const handleClear = async () => {
    setError('')
    try {
      await clearCart()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    }
  }

  if (!cart) {
    return <p className="py-16 text-center text-gray-400">Yuklanmoqda...</p>
  }

  if (cart.items.length === 0) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold">Savatingiz bo'sh</h1>
        <p className="mt-2 text-sm text-gray-500">
          Mahsulotlarni ko'rib chiqing va savatga qo'shing
        </p>
        <Link
          to="/products"
          className="mt-4 inline-block rounded-xl bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700"
        >
          Mahsulotlarga o'tish
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Savat</h1>
        <button
          onClick={() => void handleClear()}
          className="text-sm text-red-500 hover:underline"
        >
          Savatni tozalash
        </button>
      </div>

      {error && <Alert type="error" message={error} />}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {cart.items.map((item) => {
            const product = item.product
            const image = product.images?.[0]
            const isOut = product.stock === 0
            return (
              <div
                key={product._id}
                className="flex gap-4 rounded-xl border border-gray-200 p-4"
              >
                <Link
                  to={`/products/${product.slug}`}
                  className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100"
                >
                  {image ? (
                    <img
                      src={getFileUrl(image)}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                      Rasm yo'q
                    </div>
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/products/${product.slug}`}
                    className="font-medium text-gray-800 hover:text-indigo-600"
                  >
                    {product.name}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {formatPrice(product.price)} × {item.qty}
                  </p>
                  {isOut && (
                    <p className="text-xs text-red-500">
                      Mahsulot mavjud emas
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => void handleQty(product._id, item.qty - 1)}
                      className="h-8 w-8 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => void handleQty(product._id, item.qty + 1)}
                      disabled={isOut || item.qty >= product.stock}
                      className="h-8 w-8 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    >
                      +
                    </button>
                    <button
                      onClick={() => void handleRemove(product._id)}
                      className="ml-2 text-sm text-red-500 hover:underline"
                    >
                      O'chirish
                    </button>
                  </div>
                </div>
                <div className="text-right font-semibold text-gray-800">
                  {formatPrice(product.price * item.qty)}
                </div>
              </div>
            )
          })}
        </div>

        <div className="h-fit space-y-4 rounded-xl border border-gray-200 p-4">
          <h2 className="text-lg font-semibold">Buyurtma summasi</h2>
          <div className="space-y-1 text-sm text-gray-600">
            <p className="flex justify-between">
              <span>Mahsulotlar</span>
              <span>{formatPrice(cart.totals.subtotal)}</span>
            </p>
            {cart.couponCode && (
              <div className="flex justify-between">
                <span>
                  Kupon ({cart.couponCode})
                  <button
                    onClick={() => void removeCoupon()}
                    className="ml-2 text-xs text-red-500 hover:underline"
                  >
                    olib tashlash
                  </button>
                </span>
                <span className="text-green-600">
                  −{formatPrice(cart.totals.discount)}
                </span>
              </div>
            )}
          </div>
          <p className="flex justify-between border-t border-gray-100 pt-3 text-base font-bold">
            <span>Jami</span>
            <span>{formatPrice(cart.totals.total)}</span>
          </p>

          <form onSubmit={handleCoupon} className="flex gap-2">
            <Input
              id="coupon-code"
              placeholder="Kupon kodi"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <Button type="submit" isLoading={busy} variant="secondary">
              Qo'llash
            </Button>
          </form>
          {couponError && <Alert type="error" message={couponError} />}

          <Link
            to="/checkout"
            className="block rounded-xl bg-indigo-600 px-6 py-3 text-center font-medium text-white hover:bg-indigo-700"
          >
            Buyurtma berish →
          </Link>
        </div>
      </div>
    </div>
  )
}
