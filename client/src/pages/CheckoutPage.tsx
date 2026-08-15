import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '@/features/cart/CartContext'
import { checkoutApi } from '@/features/checkout/checkoutApi'
import { userApi } from '@/features/user/userApi'
import { Alert } from '@/components/ui/Alert'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { Address } from '@/types'
import { formatPrice } from '@/utils/format'

interface AddressForm {
  label: string
  fullName: string
  phone: string
  region: string
  city: string
  street: string
  zip: string
}

const emptyForm: AddressForm = {
  label: 'Uy',
  fullName: '',
  phone: '',
  region: '',
  city: '',
  street: '',
  zip: '',
}

export default function CheckoutPage() {
  const { cart, clearCart } = useCart()
  const navigate = useNavigate()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [method, setMethod] = useState<'stripe' | 'cod'>('cod')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState<AddressForm>(emptyForm)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    void (async () => {
      try {
        const { addresses: list } = await userApi.getAddresses()
        setAddresses(list)
        const def = list.find((a) => a.isDefault) ?? list[0]
        if (def) setSelectedId(def._id)
      } catch {
        setError('Manzillar yuklanmadi')
      }
    })()
  }, [])

  const handleAddAddress = async (e: FormEvent) => {
    e.preventDefault()
    setFormError('')
    try {
      const { addresses: list } = await userApi.addAddress(form)
      setAddresses(list)
      const created = list[list.length - 1]
      setSelectedId(created._id)
      setForm(emptyForm)
      setShowNew(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Manzil qo\'shilmadi')
    }
  }

  const handleSubmit = async () => {
    if (!selectedId) {
      setError('Iltimos, manzil tanlang yoki yangi qo\'shing')
      return
    }
    setError('')
    setBusy(true)
    try {
      if (method === 'stripe') {
        const { url } = await checkoutApi.stripe(selectedId)
        window.location.href = url
        return
      }
      const { order } = await checkoutApi.cod(selectedId)
      await clearCart()
      navigate(`/checkout/success?order=${order.orderNumber}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Buyurtma berilmadi')
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Buyurtma berish</h1>

      {error && <Alert type="error" message={error} />}

      {!cart || cart.items.length === 0 ? (
        <div className="rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-600">Savatingiz bo'sh — buyurtma bera olmaysiz.</p>
          <Link
            to="/products"
            className="mt-3 inline-block rounded-xl bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700"
          >
            Mahsulotlarga o'tish
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Yetkazib berish manzili</h2>
                {!showNew && (
                  <button
                    onClick={() => setShowNew(true)}
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    + Yangi manzil
                  </button>
                )}
              </div>

              {addresses.length === 0 && !showNew && (
                <p className="mt-2 text-sm text-gray-500">
                  Hali manzil qo'shilmagan. Yangi manzil qo'shing.
                </p>
              )}

              {addresses.length > 0 && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {addresses.map((a) => (
                    <label
                      key={a._id}
                      className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${
                        selectedId === a._id
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedId === a._id}
                        onChange={() => setSelectedId(a._id)}
                        className="mt-1"
                      />
                      <span className="text-sm">
                        <span className="font-medium">{a.fullName}</span> · {a.phone}
                        <br />
                        {a.region}, {a.city}, {a.street}
                        {a.zip ? `, ${a.zip}` : ''}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {showNew && (
                <form onSubmit={handleAddAddress} className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Input
                    id="addr-label"
                    label="Manzil nomi"
                    placeholder="Uy / Ish"
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                  />
                  <Input
                    id="addr-name"
                    label="Qabul qiluvchi"
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  />
                  <Input
                    id="addr-phone"
                    label="Telefon"
                    required
                    placeholder="+998..."
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                  <Input
                    id="addr-region"
                    label="Viloyat"
                    required
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                  />
                  <Input
                    id="addr-city"
                    label="Shahar"
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                  <Input
                    id="addr-street"
                    label="Ko'cha / manzil"
                    required
                    value={form.street}
                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                  />
                  <Input
                    id="addr-zip"
                    label="Pochta indeksi"
                    value={form.zip}
                    onChange={(e) => setForm({ ...form, zip: e.target.value })}
                  />
                  {formError && (
                    <div className="sm:col-span-2">
                      <Alert type="error" message={formError} />
                    </div>
                  )}
                  <div className="flex gap-2 sm:col-span-2">
                    <Button type="submit">Saqlash</Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowNew(false)}
                    >
                      Bekor qilish
                    </Button>
                  </div>
                </form>
              )}
            </section>

            <section className="rounded-xl border border-gray-200 p-4">
              <h2 className="text-lg font-semibold">To'lov usuli</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <label
                  className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${
                    method === 'cod'
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="method"
                    checked={method === 'cod'}
                    onChange={() => setMethod('cod')}
                  />
                  <span className="text-sm">
                    <span className="font-medium">Yetkazib berishda to'lash</span>
                    <br />Nagd yoki karta bilan olganda
                  </span>
                </label>
                <label
                  className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${
                    method === 'stripe'
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="method"
                    checked={method === 'stripe'}
                    onChange={() => setMethod('stripe')}
                  />
                  <span className="text-sm">
                    <span className="font-medium">Karta bilan onlayn</span>
                    <br />Stripe orqali xavfsiz to'lash
                  </span>
                </label>
              </div>
            </section>
          </div>

          <div className="h-fit space-y-4 rounded-xl border border-gray-200 p-4">
            <h2 className="text-lg font-semibold">Xulosa</h2>
            <div className="space-y-1 text-sm text-gray-600">
              {cart.items.map((it) => (
                <p key={it.product._id} className="flex justify-between">
                  <span className="truncate pr-2">
                    {it.product.name} × {it.qty}
                  </span>
                  <span>{formatPrice(it.product.price * it.qty)}</span>
                </p>
              ))}
            </div>
            <p className="flex justify-between border-t border-gray-100 pt-3 text-sm text-gray-600">
              <span>Mahsulotlar</span>
              <span>{formatPrice(cart.totals.subtotal)}</span>
            </p>
            {cart.couponCode && (
              <p className="flex justify-between text-sm text-green-600">
                <span>Kupon ({cart.couponCode})</span>
                <span>−{formatPrice(cart.totals.discount)}</span>
              </p>
            )}
            <p className="flex justify-between border-t border-gray-100 pt-3 text-base font-bold">
              <span>Jami</span>
              <span>{formatPrice(cart.totals.total)}</span>
            </p>
            <Button
              onClick={() => void handleSubmit()}
              isLoading={busy}
              className="w-full"
            >
              {method === 'stripe' ? 'Karta bilan to\'lash' : 'Buyurtmani tasdiqlash'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
