import { useState } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import { userApi } from '@/features/user/userApi'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

export function SellerTab() {
  const { user, setUser } = useAuth()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const isSeller = user?.role === 'seller'

  const handleApply = async () => {
    setError('')
    setMessage('')
    setIsLoading(true)
    try {
      const { user: updated } = await userApi.applySeller()
      setUser(updated)
      setMessage('Arizangiz qabul qilindi. Admin tasdiqlashini kuting.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md space-y-4">
      <h2 className="text-lg font-semibold">Seller bo'lish</h2>

      {message && <Alert type="success" message={message} />}
      {error && <Alert type="error" message={error} />}

      <p className="text-sm text-gray-600">
        Seller sifatida o\'z mahsulotlaringizni sotishingiz va do\'koningizni boshqarishingiz
        mumkin. Ariza topshirgach, admin tasdiqlaydi.
      </p>

      {isSeller ? (
        user?.isApproved ? (
          <Alert type="info" message="Siz tasdiqlangan seller sifatida xizmatsiz." />
        ) : (
          <Alert type="info" message="Arizangiz ko'rib chiqilmoqda. Iltimos, kuting." />
        )
      ) : (
        <Button onClick={() => void handleApply()} isLoading={isLoading}>
          Ariza yuborish
        </Button>
      )}
    </div>
  )
}
