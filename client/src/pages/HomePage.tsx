import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { catalogApi } from '@/features/catalog/catalogApi'
import { ProductCard } from '@/components/ProductCard'
import type { Category, Product } from '@/types'

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    catalogApi
      .getFeatured(8)
      .then((res) => setFeatured(res.products))
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Mahsulotlar yuklanmadi'),
      )
    catalogApi
      .getCategories()
      .then((res) => setCategories(res.categories))
      .catch(() => setCategories([]))
  }, [])

  return (
    <div className="space-y-12">
      <section className="rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-10 text-white">
        <h1 className="text-3xl font-bold">Multi-vendor e-commerce do'kon</h1>
        <p className="mt-2 text-indigo-100">
          Turli sotuvchilardan eng yaxshi mahsulotlarni toping
        </p>
        <Link
          to="/products"
          className="mt-4 inline-block rounded-xl bg-white px-6 py-3 font-medium text-indigo-600 hover:bg-indigo-50"
        >
          Mahsulotlarni ko'rish
        </Link>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Kategoriyalar</h2>
          <Link to="/products" className="text-sm text-indigo-600 hover:underline">
            Hammasi →
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {categories.map((c) => (
            <Link
              key={c._id}
              to={`/products?category=${c.slug}`}
              className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Tavsiya etilgan mahsulotlar</h2>
          <Link to="/products" className="text-sm text-indigo-600 hover:underline">
            Hammasi →
          </Link>
        </div>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        {featured.length === 0 && !error ? (
          <p className="mt-6 text-sm text-gray-400">Hozircha mahsulotlar yo'q.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
