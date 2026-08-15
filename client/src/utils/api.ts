import { API_BASE_URL } from '@/config/env'
import type { ApiFailure, ApiResponse } from '@/types'

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

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
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
