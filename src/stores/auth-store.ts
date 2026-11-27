import { z } from 'zod'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { safeJSONStorage, syncAcrossTabs, waitForHydration } from './persistStorage.ts'

const persistedAuthSchema = z.object({
  token: z.union([z.string(), z.null()]),
})

interface AuthStore {
  token: string | null
  actions: {
    setToken: (token: string | null) => void
    clearAuth: () => void
  }
}

const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      actions: {
        setToken: (token) => set({ token }),
        clearAuth: () => set({ token: null }),
      },
    }),
    {
      // Was `auth`: too generic on an origin that other GitHub Pages projects share.
      name: 'osmcha2-auth',
      storage: safeJSONStorage({ legacyName: 'auth' }),
      partialize: (state) => ({
        token: state.token,
      }),
      merge: (persistedState, currentState) => {
        const parsed = persistedAuthSchema.safeParse(persistedState)
        if (!parsed.success) return currentState
        return { ...currentState, token: parsed.data.token }
      },
    },
  ),
)

export const useAuthToken = () => useAuthStore((state) => state.token)

export const useAuthActions = () => useAuthStore((state) => state.actions)

export function getAuthToken() {
  return useAuthStore.getState().token
}

export function getAuthActions() {
  return useAuthStore.getState().actions
}

syncAcrossTabs(useAuthStore)

export function waitForAuthHydration(): Promise<void> {
  return waitForHydration(useAuthStore)
}
