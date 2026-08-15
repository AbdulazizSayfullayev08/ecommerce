const STORAGE_KEY = 'dokon_access_token'

let accessToken: string | null = localStorage.getItem(STORAGE_KEY)

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
  if (token) {
    localStorage.setItem(STORAGE_KEY, token)
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}
