import { useEffect, useState } from 'react'
import { statsApi } from '@/features/stats/statsApi'
import { Alert } from '@/components/ui/Alert'
import type { SellerStats } from '@/types'
import { formatPrice } from '@/utils/format'

function Bars({ monthly }: { monthly: { month: string; revenue: number }[] }) {
  const max = Math.max(...monthly.map((m) => m.revenue), 1)
  return (
    <div className="flex h-40 items-end gap-2">
      {monthly.map((m) => (
        <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] font-medium text-gray-500">
            {formatPrice(m.revenue)}
          </span>
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

export function StatsTab() {
  const [stats, setStats] = useState<SellerStats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    void statsApi
      .seller()
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : 'Statistika yuklanmadi'))
  }, [])

  if (error) return <Alert type="error" message={error} />
  if (!stats) return <p className="py-8 text-center text-sm text-gray-400">Yuklanmoqda...</p>

  return (
    <div>
      <h2 className="text-lg font-semibold">Statistika</h2>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <p className="text-xs text-indigo-700">Daromad</p>
          <p className="mt-1 text-lg font-bold text-indigo-800">{formatPrice(stats.revenue)}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs text-blue-700">Buyurtmalar</p>
          <p className="mt-1 text-lg font-bold text-blue-800">{stats.orders}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-xs text-green-700">Sotilgan</p>
          <p className="mt-1 text-lg font-bold text-green-800">{stats.itemsSold} dona</p>
        </div>
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
          <p className="text-xs text-purple-700">Olingan to\'lovlar</p>
          <p className="mt-1 text-lg font-bold text-purple-800">{formatPrice(stats.paidPayouts)}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700">Oxirgi 6 oy daromadi</h3>
          {stats.monthly.length === 0 ? (
            <p className="mt-3 text-sm text-gray-400">Ma\'lumot yo\'q.</p>
          ) : (
            <div className="mt-4"><Bars monthly={stats.monthly} /></div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700">Top mahsulotlar</h3>
          {stats.topProducts.length === 0 && (
            <p className="mt-3 text-sm text-gray-400">Hozircha ma\'lumot yo\'q.</p>
          )}
          <div className="mt-3 space-y-2">
            {stats.topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3 text-sm">
                <span className="w-5 font-semibold text-gray-400">{i + 1}.</span>
                <span className="flex-1 truncate font-medium text-gray-800">{p.name}</span>
                <span className="text-gray-500">×{p.qty}</span>
                <span className="font-semibold">{formatPrice(p.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
