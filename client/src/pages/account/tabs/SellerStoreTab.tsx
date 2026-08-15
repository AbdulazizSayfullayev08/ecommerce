import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { storeApi } from '@/features/store/storeApi'
import { Alert } from '@/components/ui/Alert'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { Store } from '@/types'
import { getFileUrl } from '@/utils/fileUrl'

interface StoreForm {
  name: string
  description: string
  phone: string
  address: string
}

const emptyForm: StoreForm = { name: '', description: '', phone: '', address: '' }

export function SellerStoreTab() {
  const [store, setStore] = useState<Store | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [form, setForm] = useState<StoreForm>(emptyForm)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [logoBusy, setLogoBusy] = useState(false)
  const [bannerBusy, setBannerBusy] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void (async () => {
      try {
        const { store: mine } = await storeApi.getMine()
        setStore(mine)
        setForm({
          name: mine.name,
          description: mine.description ?? '',
          phone: mine.phone ?? '',
          address: mine.address ?? '',
        })
      } catch {
        setNotFound(true)
      }
    })()
  }, [])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (notFound || !store) {
        const { store: created } = await storeApi.create(form)
        setStore(created)
        setNotFound(false)
      } else {
        const { store: updated } = await storeApi.update(form)
        setStore(updated)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Saqlanmadi')
    } finally {
      setBusy(false)
    }
  }

  const handleLogo = async (file?: File) => {
    if (!file) return
    setLogoBusy(true)
    setError('')
    try {
      const { store: updated } = await storeApi.uploadLogo(file)
      setStore(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logo yuklanmadi')
    } finally {
      setLogoBusy(false)
    }
  }

  const handleBanner = async (file?: File) => {
    if (!file) return
    setBannerBusy(true)
    setError('')
    try {
      const { store: updated } = await storeApi.uploadBanner(file)
      setStore(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Banner yuklanmadi')
    } finally {
      setBannerBusy(false)
    }
  }

  const setField = (key: keyof StoreForm) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Mening do'konim</h2>
        {store && (
          <Link
            to={`/stores/${store.slug}`}
            className="text-sm text-indigo-600 hover:underline"
          >
            Do'kon sahifasini ko'rish →
          </Link>
        )}
      </div>

      {error && <div className="mt-3"><Alert type="error" message={error} /></div>}

      {store && (
        <div className="mt-4 flex flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {store.logo ? (
              <img
                src={getFileUrl(store.logo)}
                alt="logo"
                className="h-20 w-20 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-gray-100 text-2xl font-bold text-gray-400">
                {store.name.slice(0, 1)}
              </div>
            )}
            <div>
              <Button
                variant="secondary"
                isLoading={logoBusy}
                onClick={() => logoRef.current?.click()}
              >
                Logo yuklash
              </Button>
              <input
                ref={logoRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => void handleLogo(e.target.files?.[0])}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {store.banner && (
              <img
                src={getFileUrl(store.banner)}
                alt="banner"
                className="h-20 w-40 rounded-xl object-cover"
              />
            )}
            <Button
              variant="secondary"
              isLoading={bannerBusy}
              onClick={() => bannerRef.current?.click()}
            >
              Banner yuklash
            </Button>
            <input
              ref={bannerRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => void handleBanner(e.target.files?.[0])}
            />
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="mt-4 grid gap-3 sm:grid-cols-2">
        <Input
          id="store-name"
          label="Do'kon nomi"
          required
          value={form.name}
          onChange={(e) => setField('name')(e.target.value)}
        />
        <Input
          id="store-phone"
          label="Telefon"
          placeholder="+998..."
          value={form.phone}
          onChange={(e) => setField('phone')(e.target.value)}
        />
        <div className="sm:col-span-2">
          <Input
            id="store-desc"
            label="Tavsif"
            value={form.description}
            onChange={(e) => setField('description')(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <Input
            id="store-address"
            label="Manzil"
            value={form.address}
            onChange={(e) => setField('address')(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" isLoading={busy}>
            {notFound || !store ? 'Do\'kon yaratish' : 'Saqlash'}
          </Button>
        </div>
      </form>
    </div>
  )
}
