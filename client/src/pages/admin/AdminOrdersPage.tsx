import { useCallback, useEffect, useState } from 'react'
import { orderApi } from '@/features/order/orderApi'
import { Alert } from '@/components/ui/Alert'
import { formatPrice } from '@/utils/format'
import type { Order } from '@/types'

const statusMap: Record<Order['status'], { label: string; className: string }> = {
  pending: { label: 'Kutilmoqda', className: 'bg-gray-100 text-gray-600' },
  processing: { label: 'Tayyorlanmoqda', className: 'bg-blue-100 text-blue-700' },
  shipped: { label: 'Yuborildi', className: 'bg-indigo-100 text-indigo-700' },
  delivered: { label: 'Yetkazildi', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Bekor qilingan', className: 'bg-red-100 text-red-600' },
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState<Order['status'] | ''>('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async (page = 1) => {
    setIsLoading(true)
    setError('')
    try {
      const result = await orderApi.listAdmin({
        page,
        status: statusFilter || undefined,
        limit: 20,
      })
      setOrders(result.orders)
      setTotal(result.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Buyurtmalar yuklanmadi')
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    void load(1)
  }, [load])

  const changeStatus = async (order: Order, status: Order['status']) => {
    setError('')
    setMessage('')
    setBusyId(order._id)
    try {
      const { order: updated } = await orderApi.updateStatus(order._id, status)
      setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)))
      setMessage('Buyurtma holati yangilandi')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold">Buyurtmalar</h1>
      <p className="mt-1 text-sm text-gray-500">Jami: {total}</p>

      <div className="mt-4 flex gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as Order['status'] | '')}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        >
          <option value="">Barcha holatlar</option>
          {Object.entries(statusMap).map(([key, s]) => (
            <option key={key} value={key}>{s.label}</option>
          ))}
        </select>
      </div>

      {message && <div className="mt-3"><Alert type="success" message={message} /></div>}
      {error && <div className="mt-3"><Alert type="error" message={error} /></div>}

      {isLoading ? (
        <p className="py-10 text-center text-sm text-gray-400">Yuklanmoqda...</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3">Buyurtma</th>
                <th className="px-4 py-3">Xaridor</th>
                <th className="px-4 py-3">Summa</th>
                <th className="px-4 py-3">To'lov</th>
                <th className="px-4 py-3">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => {
                const st = statusMap[order.status] ?? statusMap.pending
                return (
                  <tr key={order._id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">#{order.orderNumber}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{order.address.fullName}</p>
                      <p className="text-xs text-gray-400">{order.address.phone}</p>
                    </td>
                    <td className="px-4 py-3 font-medium">{formatPrice(order.total)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs">{order.paymentMethod === 'stripe' ? 'Karta' : 'Naqd'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${st.className}`}>
                          {st.label}
                        </span>
                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <select
                            value={order.status}
                            disabled={busyId === order._id}
                            onChange={(e) =>
                              void changeStatus(order, e.target.value as Order['status'])
                            }
                            className="rounded-lg border border-gray-300 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {Object.entries(statusMap).map(([key, s]) => (
                              <option key={key} value={key}>{s.label}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {orders.length === 0 && !isLoading && (
        <p className="py-8 text-center text-sm text-gray-400">Buyurtmalar yo'q.</p>
      )}
    </div>
  )
}
