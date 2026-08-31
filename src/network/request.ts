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

const apiErrorBodySchema = z.object({
  detail: z.string().optional(),
  message: z.string().optional(),
})

function errorMessageFromBody(data: unknown): string | undefined {
  const asString = z.string().safeParse(data)
  if (asString.success && asString.data) return asString.data
  const obj = apiErrorBodySchema.safeParse(data)
  if (!obj.success) return undefined
  if (obj.data.detail) return obj.data.detail
  if (obj.data.message) return obj.data.message
  return undefined
}

export const MISSING_CREDENTIALS_MESSAGE = 'Authentication credentials were not provided.'

export function isMissingCredentialsError(error: unknown): boolean {
  return error instanceof Error && error.message === MISSING_CREDENTIALS_MESSAGE
}

export async function handleResponse(response: Response): Promise<unknown> {
  if (!response.ok) {
    // Try to extract error message from server response
    let errorMessage = response.statusText

    try {
      const data: unknown = await response.json()
      errorMessage = errorMessageFromBody(data) ?? errorMessage
    } catch {
      // If JSON parsing fails, use statusText
    }

    throw new Error(errorMessage || 'Request failed')
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined
  }

  const data: unknown = await response.json()
  return data
}

// Convenience wrapper for common case
export async function apiFetch(endpoint: string, options?: RequestInit): Promise<unknown> {
  const req = makeApiRequest(endpoint, options)
  const res = await fetch(req)
  return handleResponse(res)
}

// Convenience methods
export const api = {
  get: (endpoint: string, options?: RequestInit) =>
    apiFetch(endpoint, { ...options, method: 'GET' }),

  post: (endpoint: string, body?: unknown, options?: RequestInit) =>
    apiFetch(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: (endpoint: string, body?: unknown, options?: RequestInit) =>
    apiFetch(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: (endpoint: string, body?: unknown, options?: RequestInit) =>
    apiFetch(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: (endpoint: string, options?: RequestInit) =>
    apiFetch(endpoint, { ...options, method: 'DELETE' }),
}
