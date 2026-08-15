import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { catalogApi } from '@/features/catalog/catalogApi'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { getFileUrl } from '@/utils/fileUrl'
import { formatPrice } from '@/utils/format'
import type { Product } from '@/types'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<'true' | 'false' | ''>('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async (page = 1) => {
    setIsLoading(true)
    setError('')
    try {
      const result = await catalogApi.listAdmin({
        q: search || undefined,
        isActive: activeFilter || undefined,
        page,
        limit: 20,
      })
      setProducts(result.products)
      setTotal(result.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mahsulotlar yuklanmadi')
    } finally {
      setIsLoading(false)
    }
  }, [search, activeFilter])

  useEffect(() => {
    void load(1)
  }, [load])

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    void load(1)
  }

  const run = async (id: string, fn: () => Promise<{ product: Product }>, success: string) => {
    setError('')
    setMessage('')
    setBusyId(id)
    try {
      const { product } = await fn()
      setProducts((prev) => prev.map((p) => (p._id === product._id ? product : p)))
      setMessage(success)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`"${product.name}" ni o\'chirishni tasdiqlaysizmi?`)) return
    setError('')
    setMessage('')
    setBusyId(product._id)
    try {
      await catalogApi.remove(product._id)
      setProducts((prev) => prev.filter((p) => p._id !== product._id))
      setMessage('Mahsulot o\'chirildi')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setBusyId(null)
    }
  }

  const sellerName = (p: Product) =>
    typeof p.seller === 'object' ? p.seller.name : 'Noma\'lum'

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold">Mahsulotlar</h1>
      <p className="mt-1 text-sm text-gray-500">Jami: {total}</p>

      <form onSubmit={handleSearch} className="mt-4 flex gap-2">
        <Input
          id="admin-product-search"
          placeholder="Nom yoki brend bo'yicha qidirish"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value as 'true' | 'false' | '')}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        >
          <option value="">Barchasi</option>
          <option value="true">Faol</option>
          <option value="false">Nofaol</option>
        </select>
        <Button type="submit">Qidirish</Button>
      </form>

      {message && <div className="mt-3"><Alert type="success" message={message} /></div>}
      {error && <div className="mt-3"><Alert type="error" message={error} /></div>}

      {isLoading ? (
        <p className="py-10 text-center text-sm text-gray-400">Yuklanmoqda...</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3">Mahsulot</th>
                <th className="px-4 py-3">Sotuvchi</th>
                <th className="px-4 py-3">Narx</th>
                <th className="px-4 py-3">Omborda</th>
                <th className="px-4 py-3">Holat</th>
                <th className="px-4 py-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product._id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.images?.[0] ? (
                        <img
                          src={getFileUrl(product.images[0])}
                          alt=""
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
                          —
                        </div>
                      )}
                      <div>
                        <p className="font-medium line-clamp-1">{product.name}</p>
                        <p className="text-xs text-gray-400">/{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{sellerName(product)}</td>
                  <td className="px-4 py-3 font-medium">{formatPrice(product.price)}</td>
                  <td className="px-4 py-3">{product.stock}</td>
                  <td className="px-4 py-3">
                    {product.isActive ? (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-600">
                        Faol
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                        Nofaol
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3 text-xs">
                      <button
                        disabled={busyId === product._id}
                        onClick={() =>
                          void run(
                            product._id,
                            () => catalogApi.setActive(product._id, !product.isActive),
                            product.isActive ? 'Mahsulot nofaol qilindi' : 'Mahsulot faollashtirildi',
                          )
                        }
                        className="font-medium text-indigo-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {product.isActive ? 'Nofaol' : 'Faol'}
                      </button>
                      <Link
                        to={`/products/${product.slug}`}
                        className="font-medium text-gray-500 hover:underline"
                      >
                        Ko\'rish
                      </Link>
                      <button
                        disabled={busyId === product._id}
                        onClick={() => void handleDelete(product)}
                        className="font-medium text-red-500 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        O\'chirish
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {products.length === 0 && !isLoading && (
        <p className="py-8 text-center text-sm text-gray-400">Mahsulotlar yo'q.</p>
      )}
    </div>
  )
}
