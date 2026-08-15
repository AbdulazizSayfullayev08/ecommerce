import { API_BASE_URL } from '@/config/env'
import type { ApiFailure, ApiResponse } from '@/types'
import { getAccessToken } from '@/features/auth/tokenStore'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, headers } = options

  const token = getAccessToken()
  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {}

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'include',
  })

  const data = (await res.json()) as ApiResponse<T>

  if (!res.ok || !data.success) {
    const message = (data as ApiFailure).message || 'Server xatosi'
    throw new Error(message)
  }

  return data.data
}
