import { API_BASE_URL } from '@/config/env'
import type { ApiFailure, ApiResponse } from '@/types'
import { getAccessToken } from '@/features/auth/tokenStore'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  isFormData?: boolean
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
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

  const data = (await res.json()) as ApiResponse<T>

  if (!res.ok || !data.success) {
    const message = (data as ApiFailure).message || 'Server xatosi'
    throw new Error(message)
  }

  return data.data
}
