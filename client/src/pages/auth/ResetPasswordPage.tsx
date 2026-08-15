import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Tiklash havolasi topilmadi')
      return
    }
    if (password !== confirmPassword) {
      setError('Parollar bir xil emas')
      return
    }
    if (password.length < 8) {
      setError('Parol kamida 8 ta belgi bo\'lishi kerak')
      return
    }

    setIsLoading(true)
    try {
      await resetPassword(token, password)
      setSuccess('Parol muvaffaqiyatli yangilandi!')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-md">
      <h1 className="text-center text-2xl font-bold">Yangi parol</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        <Input
          id="password"
          label="Yangi parol"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Kamida 8 belgi"
          required
        />
        <Input
          id="confirmPassword"
          label="Parolni takrorlang"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          required
        />

        <Button type="submit" isLoading={isLoading} className="w-full">
          Parolni saqlash
        </Button>
      </form>

      <div className="mt-4 text-center text-sm">
        <Link to="/login" className="text-gray-500 hover:underline">
          Tizimga kirishga qaytish
        </Link>
      </div>
    </div>
  )
}
