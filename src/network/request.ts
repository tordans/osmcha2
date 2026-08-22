import { z } from 'zod'
import { API_URL } from '../config/constants.ts'
import { useAuthStore } from '../stores/authStore.ts'

export function makeApiRequest(endpoint: string, options: RequestInit = {}): Request {
  const token = useAuthStore.getState().token
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) headers.set('Authorization', `Token ${token}`)

  return new Request(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })
}

function errorMessageFromBody(data: unknown): string | undefined {
  const asString = z.string().safeParse(data)
  if (asString.success && asString.data) return asString.data
  const obj = z
    .object({
      detail: z.unknown().optional(),
      message: z.unknown().optional(),
    })
    .safeParse(data)
  if (!obj.success) return undefined
  if (typeof obj.data.detail === 'string' && obj.data.detail) return obj.data.detail
  if (typeof obj.data.message === 'string' && obj.data.message) return obj.data.message
  return undefined
}

export const MISSING_CREDENTIALS_MESSAGE = 'Authentication credentials were not provided.'

export function isMissingCredentialsError(error: unknown): boolean {
  return error instanceof Error && error.message === MISSING_CREDENTIALS_MESSAGE
}

export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // Try to extract error message from server response
    let errorMessage = response.statusText

    try {
      const data = await response.json()
      errorMessage = errorMessageFromBody(data) ?? errorMessage
    } catch {
      // If JSON parsing fails, use statusText
    }

    throw new Error(errorMessage || 'Request failed')
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

// Convenience wrapper for common case
export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const req = makeApiRequest(endpoint, options)
  const res = await fetch(req)
  return handleResponse<T>(res)
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    apiFetch<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    apiFetch<T>(endpoint, { ...options, method: 'DELETE' }),
}
