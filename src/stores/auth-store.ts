import { z } from 'zod'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
      name: 'auth',
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

export function waitForAuthHydration(): Promise<void> {
  if (useAuthStore.persist.hasHydrated()) return Promise.resolve()
  return new Promise((resolve) => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      unsub()
      resolve()
    })
  })
}
