import { useState, type FormEvent } from 'react'
import { authApi } from '@/features/auth/authApi'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'

export function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (newPassword.length < 8) {
      setError('Yangi parol kamida 8 ta belgi bo\'lishi kerak')
      return
    }
    if (newPassword !== confirm) {
      setError('Parollar mos kelmadi')
      return
    }

    setIsLoading(true)
    try {
      await authApi.changePassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirm('')
      setMessage('Parol muvaffaqiyatli o\'zgartirildi')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <h2 className="text-lg font-semibold">Parolni o'zgartirish</h2>

      {message && <Alert type="success" message={message} />}
      {error && <Alert type="error" message={error} />}

      <Input
        id="pw-current"
        label="Joriy parol"
        type="password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        required
      />
      <Input
        id="pw-new"
        label="Yangi parol"
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
      />
      <Input
        id="pw-confirm"
        label="Yangi parol (takror)"
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
      />

      <Button type="submit" isLoading={isLoading}>
        Parolni yangilash
      </Button>
    </form>
  )
}
