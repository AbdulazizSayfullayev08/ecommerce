import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { catalogApi } from '@/features/catalog/catalogApi'
import { ProductCard } from '@/components/ProductCard'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import type { Category, Product, ProductSort } from '@/types'

const PAGE_SIZE = 12
const SORTS: { value: ProductSort; label: string }[] = [
  { value: 'newest', label: 'Eng yangi' },
  { value: 'price_asc', label: 'Narx: pastdan yuqori' },
  { value: 'price_desc', label: 'Narx: yuqoridan past' },
  { value: 'rating', label: 'Reyting bo\'yicha' },
]

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const q = searchParams.get('q') || ''
  const categorySlug = searchParams.get('category') || ''
  const sort = (searchParams.get('sort') as ProductSort) || 'newest'
  const page = Number(searchParams.get('page')) || 1

  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    catalogApi
      .getCategories()
      .then((res) => setCategories(res.categories))
      .catch(() => setCategories([]))
  }, [])

  const load = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const result = await catalogApi.getProducts({
        q: q || undefined,
        category: categorySlug || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        sort,
        page,
        limit: PAGE_SIZE,
      })
      setProducts(result.products)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mahsulotlar yuklanmadi')
    } finally {
      setIsLoading(false)
    }
  }, [q, categorySlug, sort, page, minPrice, maxPrice])

  useEffect(() => {
    void load()
  }, [load])

  const updateParams = useCallback(
    (patch: Record<string, string>) => {
      const next = new URLSearchParams(searchParams)
      for (const [key, value] of Object.entries(patch)) {
        if (value) next.set(key, value)
        else next.delete(key)
      }
      next.set('page', '1')
      setSearchParams(next)
    },
    [searchParams, setSearchParams],
  )

  const goToPage = (p: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(p))
    setSearchParams(next)
  }

  const pages: number[] = []
  for (let i = 1; i <= totalPages; i++) pages.push(i)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mahsulotlar</h1>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="min-w-[200px] flex-1">
          <Input
            id="catalog-q"
            label="Qidirish"
            placeholder="Mahsulot nomi, brend..."
            value={q}
            onChange={(e) => updateParams({ q: e.target.value })}
          />
        </div>
        <div className="w-44">
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Kategoriya
          </label>
          <select
            value={categorySlug}
            onChange={(e) => updateParams({ category: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          >
            <option value="">Barchasi</option>
            {categories.map((c) => (
              <option key={c._id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="w-40">
          <Input
            id="catalog-min"
            label="Min narx"
            type="number"
            min={0}
            placeholder="0"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
        </div>
        <div className="w-40">
          <Input
            id="catalog-max"
            label="Max narx"
            type="number"
            min={0}
            placeholder="10000000"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
        <div className="w-48">
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Saralash
          </label>
          <select
            value={sort}
            onChange={(e) => updateParams({ sort: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <Alert type="error" message={error} />}

      <p className="text-sm text-gray-500">Jami: {total} ta mahsulot</p>

      {isLoading ? (
        <p className="py-16 text-center text-gray-400">Yuklanmoqda...</p>
      ) : products.length === 0 ? (
        <p className="py-16 text-center text-gray-400">Mahsulot topilmadi.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            ←
          </button>
          {pages.map((p) => (
            <button
              key={p}
              onClick={() => goToPage(p)}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                p === page
                  ? 'bg-indigo-600 text-white'
                  : 'border border-gray-300 text-gray-700'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            disabled={page >= totalPages}
            onClick={() => goToPage(page + 1)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            →
          </button>
        </div>
      )}
    </div>
  )
}
