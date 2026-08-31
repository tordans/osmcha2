import { z } from 'zod'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { parseTokenPaste } from '../utils/auth.ts'

const persistedAuthSchema = z.object({
  token: z.union([z.string(), z.null()]),
})

interface AuthState {
  token: string | null
  setToken: (token: string | null) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
      clearAuth: () => set({ token: null }),
    }),
    {
      name: 'auth',
      partialize: (state) => ({
        token: state.token,
      }),
      merge: (persistedState, currentState) => {
        const parsed = persistedAuthSchema.safeParse(persistedState)
        if (!parsed.success) return currentState
        return { ...currentState, token: parsed.data.token }
      },
      // One-time migration from Redux localStorage
      onRehydrateStorage: () => (state) => {
        if (state && !state.token) {
          const legacyRaw = localStorage.getItem('token')
          if (legacyRaw) {
            const token = parseTokenPaste(legacyRaw)
            if (token) state.setToken(token)
            // Clean up old Redux keys
            localStorage.removeItem('token')
            localStorage.removeItem('oauth_token')
            localStorage.removeItem('oauth_token_secret')
          }
        }
      },
    },
  ),
)

export function waitForAuthHydration(): Promise<void> {
  if (useAuthStore.persist.hasHydrated()) return Promise.resolve()
  return new Promise((resolve) => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      unsub()
      resolve()
    })
  })
}
