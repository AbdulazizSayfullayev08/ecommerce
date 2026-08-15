import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

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
      const user = await register(name, email, password)
      navigate(`/verify-email?email=${encodeURIComponent(user.email)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-md">
      <h1 className="text-center text-2xl font-bold">Ro'yxatdan o'tish</h1>
      <p className="mt-1 text-center text-sm text-gray-500">
        Akkountingiz bormi?{' '}
        <Link to="/login" className="font-medium text-indigo-600 hover:underline">
          Tizimga kiring
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && <Alert type="error" message={error} />}

        <Input
          id="name"
          label="Ism"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ali Valiyev"
          required
        />
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
          Ro'yxatdan o'tish
        </Button>
      </form>
    </div>
  )
}
