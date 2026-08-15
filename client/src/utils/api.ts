import { API_BASE_URL } from '@/config/env'
import type { ApiFailure, ApiResponse, AuthResponse } from '@/types'
import { getAccessToken, setAccessToken } from '@/features/auth/tokenStore'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  isFormData?: boolean
}

let refreshPromise: Promise<boolean> | null = null

async function doRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
    let data: ApiResponse<AuthResponse>
    try {
      data = (await res.json()) as ApiResponse<AuthResponse>
    } catch {
      data = { success: false, message: 'Server xatosi' }
    }
    if (!res.ok || !data.success) {
      setAccessToken(null)
      return false
    }
    setAccessToken(data.data.accessToken)
    return true
  } catch {
    setAccessToken(null)
    return false
  }
}

function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
  retried = false,
): Promise<T> {
  const { method = 'GET', body, headers, isFormData } = options

  const token = getAccessToken()
  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {}

  const finalHeaders: Record<string, string> = {
    ...authHeaders,
    ...headers,
  }
  if (!isFormData) {
    finalHeaders['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body:
      body !== undefined
        ? isFormData
          ? (body as BodyInit)
          : JSON.stringify(body)
        : undefined,
    credentials: 'include',
  })

  let data: ApiResponse<T>
  try {
    data = (await res.json()) as ApiResponse<T>
  } catch {
    throw new Error(`Server xatosi (${res.status})`)
  }

  if (res.status === 401 && !retried) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      return apiRequest<T>(path, options, true)
    }
    window.dispatchEvent(new Event('dokon:auth-failed'))
  }

  if (!res.ok || !data.success) {
    const message = (data as ApiFailure).message || 'Server xatosi'
    throw new Error(message)
  }

  return data.data
}
