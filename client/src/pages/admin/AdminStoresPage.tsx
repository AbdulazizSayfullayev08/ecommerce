import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { storeApi } from '@/features/store/storeApi'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { getFileUrl } from '@/utils/fileUrl'
import type { Store } from '@/types'

type AdminStore = Store & { productCount: number }

export default function AdminStoresPage() {
  const [stores, setStores] = useState<AdminStore[]>([])
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
      const result = await storeApi.listAdmin({
        q: search || undefined,
        isActive: activeFilter || undefined,
        page,
      })
      setStores(result.stores)
      setTotal(result.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Do\'konlar yuklanmadi')
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

  const toggleActive = async (store: AdminStore) => {
    setError('')
    setMessage('')
    setBusyId(store._id)
    try {
      const { store: updated } = await storeApi.toggleActive(store._id, !store.isActive)
      setStores((prev) =>
        prev.map((s) => (s._id === updated._id ? { ...updated, productCount: s.productCount } : s)),
      )
      setMessage(updated.isActive ? 'Do\'kon faollashtirildi' : 'Do\'kon nofaol qilindi')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setBusyId(null)
    }
  }

  const ownerName = (s: Store) =>
    typeof s.owner === 'object' ? s.owner.name : 'Noma\'lum'

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold">Do'konlar</h1>
      <p className="mt-1 text-sm text-gray-500">Jami: {total}</p>

      <form onSubmit={handleSearch} className="mt-4 flex gap-2">
        <Input
          id="admin-store-search"
          placeholder="Do'kon nomi bo'yicha qidirish"
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
                <th className="px-4 py-3">Do'kon</th>
                <th className="px-4 py-3">Egasi</th>
                <th className="px-4 py-3">Mahsulotlar</th>
                <th className="px-4 py-3">Holat</th>
                <th className="px-4 py-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stores.map((store) => (
                <tr key={store._id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {store.logo ? (
                        <img
                          src={getFileUrl(store.logo)}
                          alt=""
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
                          —
                        </div>
                      )}
                      <div>
                        <p className="font-medium line-clamp-1">{store.name}</p>
                        <p className="text-xs text-gray-400">/{store.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{ownerName(store)}</td>
                  <td className="px-4 py-3">{store.productCount}</td>
                  <td className="px-4 py-3">
                    {store.isActive ? (
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
                        disabled={busyId === store._id}
                        onClick={() => void toggleActive(store)}
                        className="font-medium text-indigo-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {store.isActive ? 'Nofaol' : 'Faol'}
                      </button>
                      <Link
                        to={`/stores/${store.slug}`}
                        className="font-medium text-gray-500 hover:underline"
                      >
                        Ko\'rish
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {stores.length === 0 && !isLoading && (
        <p className="py-8 text-center text-sm text-gray-400">Do'konlar yo'q.</p>
      )}
    </div>
  )
}
