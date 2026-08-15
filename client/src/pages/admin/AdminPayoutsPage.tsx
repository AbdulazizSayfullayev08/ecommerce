import { useEffect, useState } from 'react'
import { payoutApi } from '@/features/payout/payoutApi'
import { Alert } from '@/components/ui/Alert'
import type { Payout } from '@/types'
import { formatPrice } from '@/utils/format'

const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: 'Kutilmoqda', className: 'bg-yellow-100 text-yellow-700' },
  paid: { label: 'To\'landi', className: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rad etilgan', className: 'bg-red-100 text-red-600' },
}

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [filter, setFilter] = useState('')
  const [total, setTotal] = useState(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load(status = filter) {
    setError('')
    try {
      const data = await payoutApi.listAdmin({ status: status || undefined })
      setPayouts(data.payouts)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'To\'lovlar yuklanmadi')
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  async function handle(id: string, status: 'paid' | 'rejected') {
    setError('')
    setMessage('')
    setBusyId(id)
    try {
      await payoutApi.handle(id, status)
      setMessage(status === 'paid' ? 'To\'lov tasdiqlandi' : 'To\'lov rad etildi')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold">To'lovlar</h1>
      <p className="mt-1 text-sm text-gray-500">Jami: {total}</p>

      <div className="mt-4 flex gap-2">
        {['', 'pending', 'paid', 'rejected'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setFilter(s)}
            className={
              filter === s
                ? 'rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white'
                : 'rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-indigo-400'
            }
          >
            {s === '' ? 'Barchasi' : s === 'pending' ? 'Kutilmoqda' : s === 'paid' ? 'To\'langan' : 'Rad etilgan'}
          </button>
        ))}
      </div>

      {message && <div className="mt-3"><Alert type="success" message={message} /></div>}
      {error && <div className="mt-3"><Alert type="error" message={error} /></div>}

      <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3">Seller</th>
              <th className="px-4 py-3">So'mma</th>
              <th className="px-4 py-3">Sana</th>
              <th className="px-4 py-3">Holat</th>
              <th className="px-4 py-3 text-right">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payouts.map((p) => {
              const st = statusMap[p.status] ?? statusMap.pending
              const seller = typeof p.seller === 'string' ? p.seller : p.seller?.name ?? '—'
              return (
                <tr key={p._id}>
                  <td className="px-4 py-3 font-medium">{seller}</td>
                  <td className="px-4 py-3 font-semibold">{formatPrice(p.amount)}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(p.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.className}`}>
                      {st.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.status === 'pending' && (
                      <div className="flex justify-end gap-3 text-xs">
                        <button
                          disabled={busyId === p._id}
                          onClick={() => void handle(p._id, 'paid')}
                          className="font-medium text-green-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Tasdiqlash
                        </button>
                        <button
                          disabled={busyId === p._id}
                          onClick={() => void handle(p._id, 'rejected')}
                          className="font-medium text-red-500 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Rad etish
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {payouts.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-400">To'lov so'rovlari yo'q.</p>
      )}
    </div>
  )
}
