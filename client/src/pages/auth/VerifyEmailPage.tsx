import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'

export default function VerifyEmailPage() {
  const { verifyEmail, resendOtp } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialEmail = searchParams.get('email') || ''

  const [email, setEmail] = useState(initialEmail)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await verifyEmail(email, otp)
      setSuccess('Email tasdiqlandi! Endi tizimga kirishingiz mumkin.')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setResendLoading(true)
    try {
      await resendOtp(email)
      setSuccess('Yangi OTP kod emailingizga yuborildi')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-md">
      <h1 className="text-center text-2xl font-bold">Email tasdiqlash</h1>
      <p className="mt-1 text-center text-sm text-gray-500">
        Emailingizga yuborilgan 6 xonali kodni kiriting
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        <Input
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          id="otp"
          label="OTP kod"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          placeholder="123456"
          required
        />

        <Button type="submit" isLoading={isLoading} className="w-full">
          Tasdiqlash
        </Button>
      </form>

      <div className="mt-4 text-center text-sm text-gray-500">
        Kod kelmadimi?{' '}
        <button
          onClick={handleResend}
          disabled={resendLoading}
          className="font-medium text-indigo-600 hover:underline"
        >
          {resendLoading ? 'Yuborilmoqda...' : 'Qayta yuborish'}
        </button>
      </div>

      <div className="mt-2 text-center text-sm">
        <Link to="/login" className="text-gray-500 hover:underline">
          Tizimga kirishga qaytish
        </Link>
      </div>
    </div>
  )
}
