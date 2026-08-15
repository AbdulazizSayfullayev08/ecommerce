import { useEffect, useState } from 'react'
import { payoutApi } from '@/features/payout/payoutApi'
import { Alert } from '@/components/ui/Alert'
import type { Payout, SellerEarning } from '@/types'
import { formatPrice } from '@/utils/format'

const payoutStatusMap: Record<string, { label: string; className: string }> = {
  pending: { label: 'Kutilmoqda', className: 'bg-yellow-100 text-yellow-700' },
  paid: { label: 'To\'landi', className: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rad etilgan', className: 'bg-red-100 text-red-600' },
}

const earningStatusMap: Record<string, { label: string; className: string }> = {
  pending: { label: 'Kutilmoqda', className: 'bg-gray-100 text-gray-600' },
  available: { label: 'Mavjud', className: 'bg-green-100 text-green-700' },
  processing: { label: 'Jarayonda', className: 'bg-blue-100 text-blue-700' },
  paid: { label: 'To\'landi', className: 'bg-indigo-100 text-indigo-700' },
}

export function PayoutTab() {
  const [available, setAvailable] = useState(0)
  const [processing, setProcessing] = useState(0)
  const [paid, setPaid] = useState(0)
  const [earnings, setEarnings] = useState<SellerEarning[]>([])
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function load() {
    const data = await payoutApi.summary()
    setAvailable(data.available)
    setProcessing(data.processing)
    setPaid(data.paid)
    setEarnings(data.recentEarnings)
    setPayouts(data.payouts)
  }

  useEffect(() => {
    void load().catch((err) =>
      setError(err instanceof Error ? err.message : 'Balans yuklanmadi')
    )
  }, [])

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    try {
      await payoutApi.request(Number(amount))
      setInfo('To\'lov so\'rovi yuborildi. Admin tasdiqlashini kuting.')
      setAmount('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'So\'rov yuborilmadi')
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold">To'lovlar</h2>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-xs text-green-700">Mavjud balans</p>
          <p className="mt-1 text-lg font-bold text-green-800">{formatPrice(available)}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs text-blue-700">Jarayonda</p>
          <p className="mt-1 text-lg font-bold text-blue-800">{formatPrice(processing)}</p>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <p className="text-xs text-indigo-700">Umumiy to'langan</p>
          <p className="mt-1 text-lg font-bold text-indigo-800">{formatPrice(paid)}</p>
        </div>
      </div>

      {error && <div className="mt-3"><Alert type="error" message={error} /></div>}
      {info && <div className="mt-3"><Alert type="success" message={info} /></div>}

      <form onSubmit={handleRequest} className="mt-4 flex items-end gap-3">
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700">So'mma (so'm)</label>
          <input
            type="number"
            min={1}
            max={available || undefined}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={available ? `Maks: ${available.toLocaleString()}` : 'Mavjud balans yo\'q'}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>
        <button
          type="submit"
          disabled={!amount || Number(amount) <= 0 || Number(amount) > available}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          So'rov yuborish
        </button>
      </form>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Yaqin daromadlar</h3>
          {earnings.length === 0 && <p className="mt-2 text-sm text-gray-500">Hozircha yo'q.</p>}
          <div className="mt-2 space-y-2">
            {earnings.map((e) => {
              const st = earningStatusMap[e.status] ?? earningStatusMap.pending
              return (
                <div key={e._id} className="rounded-lg border border-gray-200 p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-800">{e.orderNumber}</span>
                    <span className="font-semibold">{formatPrice(e.amount)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                    <span>Komissiya: {formatPrice(e.commission)}</span>
                    <span className={`rounded-full px-2 py-0.5 font-medium ${st.className}`}>
                      {st.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700">To'lov so'rovlari</h3>
          {payouts.length === 0 && <p className="mt-2 text-sm text-gray-500">Hozircha yo'q.</p>}
          <div className="mt-2 space-y-2">
            {payouts.map((p) => {
              const st = payoutStatusMap[p.status] ?? payoutStatusMap.pending
              return (
                <div key={p._id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 text-sm">
                  <div>
                    <p className="font-semibold text-gray-800">{formatPrice(p.amount)}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(p.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.className}`}>
                    {st.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
