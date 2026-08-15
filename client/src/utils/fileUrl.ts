import { API_BASE_URL } from '@/config/env'

export function getFileUrl(path?: string): string | undefined {
  if (!path) return undefined
  if (/^https?:\/\//.test(path)) return path
  if (path.startsWith('/') && API_BASE_URL.startsWith('http')) {
    try {
      return `${new URL(API_BASE_URL).origin}${path}`
    } catch {
      return path
    }
  }
  return path
}
