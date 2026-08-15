import { useEffect, useState } from 'react'
import { statsApi } from '@/features/stats/statsApi'
import { Alert } from '@/components/ui/Alert'
import type { AdminStats } from '@/types'
import { formatPrice } from '@/utils/format'

function Bars({ monthly }: { monthly: { month: string; revenue: number }[] }) {
  const max = Math.max(...monthly.map((m) => m.revenue), 1)
  return (
    <div className="flex h-40 items-end gap-2">
      {monthly.map((m) => (
        <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] font-medium text-gray-500">{formatPrice(m.revenue)}</span>
          <div
            className="w-full rounded-t bg-indigo-500"
            style={{ height: `${Math.round((m.revenue / max) * 100)}%` }}
            title={`${m.month}: ${formatPrice(m.revenue)}`}
          />
          <span className="text-[10px] text-gray-400">{m.month.slice(2)}</span>
        </div>
      ))}
    </div>
  )
}

export default function AdminStatsPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    void statsApi
      .admin()
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : 'Statistika yuklanmadi'))
  }, [])

  if (error) return <div className="mx-auto max-w-5xl"><Alert type="error" message={error} /></div>
  if (!stats) return <p className="py-10 text-center text-sm text-gray-400">Yuklanmoqda...</p>

  const cards = [
    { label: 'Umumiy daromad', value: formatPrice(stats.revenue), cls: 'border-indigo-200 bg-indigo-50 text-indigo-800' },
    { label: 'Yetkazilgan buyurtmalar', value: String(stats.deliveredOrders), cls: 'border-blue-200 bg-blue-50 text-blue-800' },
    { label: 'Barcha buyurtmalar', value: String(stats.orders), cls: 'border-green-200 bg-green-50 text-green-800' },
    { label: 'Foydalanuvchilar', value: String(stats.users), cls: 'border-purple-200 bg-purple-50 text-purple-800' },
    { label: 'Sellerlar', value: String(stats.sellers), cls: 'border-amber-200 bg-amber-50 text-amber-800' },
    { label: 'Mahsulotlar', value: String(stats.products), cls: 'border-teal-200 bg-teal-50 text-teal-800' },
    { label: 'Do\'konlar', value: String(stats.stores), cls: 'border-rose-200 bg-rose-50 text-rose-800' },
    { label: 'Kutilayotgan to\'lovlar', value: String(stats.pendingPayouts), cls: 'border-gray-200 bg-gray-50 text-gray-800' },
  ]

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold">Statistika</h1>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-xl border p-4 ${c.cls}`}>
            <p className="text-xs">{c.label}</p>
            <p className="mt-1 text-lg font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-700">Oxirgi 6 oy daromadi</h2>
          {stats.monthly.length === 0 ? (
            <p className="mt-3 text-sm text-gray-400">Ma\'lumot yo\'q.</p>
          ) : (
            <div className="mt-4"><Bars monthly={stats.monthly} /></div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-700">Top sellerlar</h2>
          {stats.topSellers.length === 0 && (
            <p className="mt-3 text-sm text-gray-400">Hozircha ma\'lumot yo\'q.</p>
          )}
          <div className="mt-3 space-y-2">
            {stats.topSellers.map((s, i) => (
              <div key={s.name} className="flex items-center gap-3 text-sm">
                <span className="w-5 font-semibold text-gray-400">{i + 1}.</span>
                <span className="flex-1 truncate font-medium text-gray-800">{s.name}</span>
                <span className="text-gray-500">{s.orders} ta buyurtma</span>
                <span className="font-semibold">{formatPrice(s.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
