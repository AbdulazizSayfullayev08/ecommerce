import { useRef, useState, type FormEvent } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import { userApi } from '@/features/user/userApi'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { getFileUrl } from '@/utils/fileUrl'

export function ProfileTab() {
  const { user, setUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setMessage('')
    setError('')
    setIsLoading(true)
    try {
      const { user: updated } = await userApi.updateProfile({ name, phone })
      setUser(updated)
      setMessage('Profil saqlandi')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatar = async (file: File) => {
    setError('')
    setMessage('')
    setIsUploading(true)
    try {
      const { user: updated } = await userApi.uploadAvatar(file)
      setUser(updated)
      setMessage('Rasm yangilandi')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rasm yuklanmadi')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold">Profil ma'lumotlari</h2>

      {message && <Alert type="success" message={message} />}
      {error && <Alert type="error" message={error} />}

      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-2xl font-bold text-gray-500">
          {user?.avatar ? (
            <img
              src={getFileUrl(user.avatar)}
              alt="Avatar"
              className="h-full w-full object-cover"
            />
          ) : (
            user?.name?.[0]?.toUpperCase()
          )}
        </div>
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleAvatar(file)
            }}
          />
          <Button
            type="button"
            variant="secondary"
            isLoading={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            Rasmni yangilash
          </Button>
          <p className="text-xs text-gray-400">JPG, PNG, WebP yoki GIF. 5 MB gacha.</p>
        </div>
      </div>

      <Input
        id="name"
        label="Ism"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Input
        id="phone"
        label="Telefon"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+998901234567"
      />

      <Button type="submit" isLoading={isLoading}>
        Saqlash
      </Button>
    </form>
  )
}
