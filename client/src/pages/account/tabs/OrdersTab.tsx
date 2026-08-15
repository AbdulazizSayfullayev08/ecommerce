import { useEffect, useState } from 'react'
import { orderApi } from '@/features/order/orderApi'
import { Alert } from '@/components/ui/Alert'
import type { Order } from '@/types'
import { formatPrice } from '@/utils/format'

const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: 'Kutilmoqda', className: 'bg-gray-100 text-gray-600' },
  processing: { label: 'Tayyorlanmoqda', className: 'bg-blue-100 text-blue-700' },
  shipped: { label: 'Yuborildi', className: 'bg-indigo-100 text-indigo-700' },
  delivered: { label: 'Yetkazildi', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Bekor qilingan', className: 'bg-red-100 text-red-600' },
}

export function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState('')

  useEffect(() => {
    void (async () => {
      try {
        const data = await orderApi.listMine({ page })
        setOrders(data.orders)
        setTotal(data.total)
        setPages(data.pages)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Buyurtmalar yuklanmadi')
      }
    })()
  }, [page])

  return (
    <div>
      <h2 className="text-lg font-semibold">Buyurtmalarim</h2>
      <p className="mt-1 text-sm text-gray-500">Jami: {total} ta buyurtma</p>

      {error && <div className="mt-3"><Alert type="error" message={error} /></div>}

      {orders.length === 0 && !error && (
        <p className="mt-4 text-gray-500">Hozircha buyurtmalar yo'q.</p>
      )}

      <div className="mt-4 space-y-3">
        {orders.map((order) => {
          const st = statusMap[order.status] ?? statusMap.pending
          const isOpen = expanded === order._id
          return (
            <div
              key={order._id}
              className="rounded-xl border border-gray-200 p-4"
            >
              <button
                onClick={() => setExpanded(isOpen ? '' : order._id)}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <span>
                  <span className="font-medium text-gray-800">{order.orderNumber}</span>
                  <span className="ml-2 text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-sm font-semibold">{formatPrice(order.total)}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.className}`}>
                    {st.label}
                  </span>
                </span>
              </button>

              {isOpen && (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <div className="space-y-1 text-sm text-gray-600">
                    {order.items.map((it) => (
                      <p key={it.product} className="flex justify-between">
                        <span>{it.name} × {it.qty}</span>
                        <span>{formatPrice(it.price * it.qty)}</span>
                      </p>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between border-t border-gray-100 pt-2 text-sm">
                    <span className="text-gray-500">Mahsulotlar</span>
                    <span>{formatPrice(order.subtotal)}</span>
                  </div>
                  {order.discount > 0 && (
                    <p className="flex justify-between text-sm text-green-600">
                      <span>Kupon ({order.couponCode})</span>
                      <span>−{formatPrice(order.discount)}</span>
                    </p>
                  )}
                  <p className="mt-1 flex justify-between text-sm font-semibold">
                    <span>Jami</span>
                    <span>{formatPrice(order.total)}</span>
                  </p>
                  <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                    <p>
                      <strong>Qabul qiluvchi:</strong> {order.address.fullName} · {order.address.phone}
                    </p>
                    <p>
                      <strong>Manzil:</strong> {order.address.region}, {order.address.city}, {order.address.street}
                    </p>
                    <p>
                      <strong>To'lov:</strong>{' '}
                      {order.paymentMethod === 'cod' ? 'Yetkazib berishda to\'lash' : 'Karta (Stripe)'} ·{' '}
                      {order.paymentStatus === 'paid' ? 'To\'langan' : 'To\'lov kutilmoqda'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            ← Oldingi
          </button>
          <span className="text-sm text-gray-500">
            {page} / {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Keyingi →
          </button>
        </div>
      )}
    </div>
  )
}
