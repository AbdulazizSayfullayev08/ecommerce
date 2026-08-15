import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { userApi, type AddressInput } from '@/features/user/userApi'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import type { Address } from '@/types'

const emptyForm: AddressInput = {
  label: 'Uy',
  fullName: '',
  phone: '',
  country: 'O\'zbekiston',
  region: '',
  city: '',
  street: '',
  zip: '',
}

export function AddressesTab() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [form, setForm] = useState<AddressInput>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const load = useCallback(async () => {
    try {
      const { addresses } = await userApi.getAddresses()
      setAddresses(addresses)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Manzillar yuklanmadi')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setIsLoading(true)
    try {
      const { addresses: updated } = editingId
        ? await userApi.updateAddress(editingId, form)
        : await userApi.addAddress(form)
      setAddresses(updated)
      setForm(emptyForm)
      setIsFormOpen(false)
      setEditingId(null)
      setMessage(editingId ? 'Manzil yangilandi' : 'Manzil qo\'shildi')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setError('')
    try {
      const { addresses: updated } = await userApi.deleteAddress(id)
      setAddresses(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'O\'chirilmadi')
    }
  }

  const handleDefault = async (id: string) => {
    setError('')
    try {
      const { addresses: updated } = await userApi.setDefaultAddress(id)
      setAddresses(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    }
  }

  const startEdit = (address: Address) => {
    setEditingId(address._id)
    setForm({
      label: address.label,
      fullName: address.fullName,
      phone: address.phone,
      country: address.country,
      region: address.region,
      city: address.city,
      street: address.street,
      zip: address.zip,
      isDefault: address.isDefault,
    })
    setIsFormOpen(true)
    setError('')
    setMessage('')
  }

  const set = (field: keyof AddressInput) => (value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Yetkazib berish manzillari</h2>
        {!isFormOpen && (
          <Button type="button" onClick={() => setIsFormOpen(true)}>
            + Manzil qo\'shish
          </Button>
        )}
      </div>

      {message && <Alert type="success" message={message} />}
      {error && <Alert type="error" message={error} />}

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-gray-200 p-4">
          <Input
            id="a-label"
            label="Nomi"
            value={form.label ?? ''}
            onChange={(e) => set('label')(e.target.value)}
            placeholder="Uy / Ish"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              id="a-fullName"
              label="Qabul qiluvchi"
              value={form.fullName}
              onChange={(e) => set('fullName')(e.target.value)}
              required
            />
            <Input
              id="a-phone"
              label="Telefon"
              value={form.phone}
              onChange={(e) => set('phone')(e.target.value)}
              required
            />
            <Input
              id="a-country"
              label="Davlat"
              value={form.country ?? ''}
              onChange={(e) => set('country')(e.target.value)}
            />
            <Input
              id="a-region"
              label="Viloyat"
              value={form.region}
              onChange={(e) => set('region')(e.target.value)}
              required
            />
            <Input
              id="a-city"
              label="Shahar"
              value={form.city}
              onChange={(e) => set('city')(e.target.value)}
              required
            />
            <Input
              id="a-zip"
              label="Pochta indeksi"
              value={form.zip ?? ''}
              onChange={(e) => set('zip')(e.target.value)}
            />
          </div>
          <Input
            id="a-street"
            label="Ko'cha, uy"
            value={form.street}
            onChange={(e) => set('street')(e.target.value)}
            required
          />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={!!form.isDefault}
              onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            Standart manzil qilib belgilash
          </label>
          <div className="flex gap-2">
            <Button type="submit" isLoading={isLoading}>
              {editingId ? 'Saqlash' : 'Qo\'shish'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsFormOpen(false)
                setEditingId(null)
                setForm(emptyForm)
              }}
            >
              Bekor qilish
            </Button>
          </div>
        </form>
      )}

      {addresses.length === 0 && !isFormOpen ? (
        <p className="py-8 text-center text-sm text-gray-400">
          Hozircha manzil yo'q. Manzil qo'shing.
        </p>
      ) : (
        <ul className="space-y-3">
          {addresses.map((address) => (
            <li
              key={address._id}
              className="flex items-start justify-between rounded-lg border border-gray-200 p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{address.label}</span>
                  {address.isDefault && (
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600">
                      Standart
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-700">
                  {address.fullName} · {address.phone}
                </p>
                <p className="text-sm text-gray-500">
                  {address.region}, {address.city}, {address.street}
                  {address.zip ? `, ${address.zip}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {!address.isDefault && (
                  <button
                    onClick={() => void handleDefault(address._id)}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Standart qilish
                  </button>
                )}
                <button
                  onClick={() => startEdit(address)}
                  className="text-xs text-gray-600 hover:underline"
                >
                  Tahrirlash
                </button>
                <button
                  onClick={() => void handleDelete(address._id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  O\'chirish
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
