import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { authApi } from './authApi'
import { getAccessToken, setAccessToken } from './tokenStore'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (name: string, email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  verifyEmail: (email: string, otp: string) => Promise<void>
  resendOtp: (email: string) => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, password: string) => Promise<void>
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      try {
        if (!getAccessToken()) {
          const { accessToken } = await authApi.refresh()
          setAccessToken(accessToken)
        }
        const { user } = await authApi.getMe()
        setUser(user)
      } catch {
        setAccessToken(null)
      } finally {
        setIsLoading(false)
      }
    }
    init()

    const handleAuthFailed = () => {
      setAccessToken(null)
      setUser(null)
    }
    window.addEventListener('dokon:auth-failed', handleAuthFailed)
    return () => window.removeEventListener('dokon:auth-failed', handleAuthFailed)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { user, accessToken } = await authApi.login({ email, password })
    setAccessToken(accessToken)
    setUser(user)
    return user
  }, [])

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const { user } = await authApi.register({ name, email, password })
      return user
    },
    [],
  )

  const verifyEmail = useCallback(
    async (email: string, otp: string) => {
      await authApi.verifyEmail({ email, otp })
    },
    [],
  )

  const resendOtp = useCallback(
    async (email: string) => {
      await authApi.resendOtp(email)
    },
    [],
  )

  const forgotPassword = useCallback(async (email: string) => {
    await authApi.forgotPassword(email)
  }, [])

  const resetPassword = useCallback(
    async (token: string, password: string) => {
      await authApi.resetPassword({ token, password })
    },
    [],
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      setAccessToken(null)
      setUser(null)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        verifyEmail,
        resendOtp,
        forgotPassword,
        resetPassword,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth AuthProvider ichida ishlatilishi kerak')
  }
  return ctx
}
