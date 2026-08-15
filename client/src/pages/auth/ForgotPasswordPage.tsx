import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth()

  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await forgotPassword(email)
      setSuccess('Emailingizga parol tiklash havolasi yuborildi')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-md">
      <h1 className="text-center text-2xl font-bold">Parolni tiklash</h1>
      <p className="mt-1 text-center text-sm text-gray-500">
        Emailingizni kiriting, parol tiklash havolasi yuboriladi
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
          placeholder="siz@example.com"
          required
        />

        <Button type="submit" isLoading={isLoading} className="w-full">
          Havola yuborish
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
