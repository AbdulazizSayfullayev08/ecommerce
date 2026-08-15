import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const user = await login(email, password)
      navigate(user.role === 'admin' ? '/admin/users' : '/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-md">
      <h1 className="text-center text-2xl font-bold">Tizimga kirish</h1>
      <p className="mt-1 text-center text-sm text-gray-500">
        Akkountingiz yo'qmi?{' '}
        <Link to="/register" className="font-medium text-indigo-600 hover:underline">
          Ro'yxatdan o'ting
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && <Alert type="error" message={error} />}

        <Input
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="siz@example.com"
          required
        />
        <Input
          id="password"
          label="Parol"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />

        <div className="flex items-center justify-between">
          <Link
            to="/forgot-password"
            className="text-sm text-indigo-600 hover:underline"
          >
            Parolni unutdingizmi?
          </Link>
        </div>

        <Button type="submit" isLoading={isLoading} className="w-full">
          Kirish
        </Button>
      </form>
    </div>
  )
}
