import { toast } from 'sonner'
import type { PersistStorage, StorageValue } from 'zustand/middleware'

let warnedWriteFailure = false

function warnWriteFailure(name: string, error: unknown) {
  console.warn(`Could not save '${name}' in browser storage`, error)
  if (warnedWriteFailure) return
  warnedWriteFailure = true
  toast.error('Could not save your changes in this browser', {
    description: 'Browser storage is full or blocked. Changes stay until you reload.',
  })
}

/** `localStorage`, or null where reading it throws (site data blocked). */
function localStorageOrNull(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

/**
 * JSON storage for `persist` that never throws. Zustand's `createJSONStorage` lets a blocked
 * `localStorage`, a corrupt value or a full quota escape: the store then has no `persist` API,
 * never finishes hydrating, or throws out of the action that changed state. Here a value that
 * cannot be read counts as missing, and a failed write keeps the state in memory and tells the
 * user once.
 *
 * `legacyName`: a key the value was stored under before, read while `name` has no value yet. It is
 * left in place: on a shared origin another app may own a key of that name.
 */
export function safeJSONStorage<S>({
  legacyName,
}: { legacyName?: string } = {}): PersistStorage<S> {
  return {
    getItem: (name) => {
      const storage = localStorageOrNull()
      if (!storage) return null
      try {
        const raw = storage.getItem(name) ?? (legacyName ? storage.getItem(legacyName) : null)
        return raw == null ? null : (JSON.parse(raw) as StorageValue<S>)
      } catch (error) {
        console.warn(`Ignoring unreadable '${name}' in browser storage`, error)
        return null
      }
    },
    setItem: (name, value) => {
      const storage = localStorageOrNull()
      if (!storage) return
      try {
        storage.setItem(name, JSON.stringify(value))
      } catch (error) {
        warnWriteFailure(name, error)
      }
    },
    removeItem: (name) => {
      try {
        localStorageOrNull()?.removeItem(name)
      } catch {
        // Nothing to clean up where storage is blocked.
      }
    },
  }
}

type PersistedStore = {
  persist: { getOptions: () => { name?: string }; rehydrate: () => Promise<void> | void }
}

/**
 * Reloads the store when another tab writes its key, so tabs do not overwrite each other's
 * progress with a stale copy. Call once at module level.
 */
export function syncAcrossTabs(store: PersistedStore) {
  if (typeof window === 'undefined') return
  window.addEventListener('storage', (event) => {
    if (event.storageArea !== localStorageOrNull()) return
    if (event.key !== null && event.key !== store.persist.getOptions().name) return
    void store.persist.rehydrate()
  })
}

/** Resolves once the store read its stored value; at once when that already happened. */
export function waitForHydration(store: {
  persist: {
    hasHydrated: () => boolean
    onFinishHydration: (listener: () => void) => () => void
  }
}): Promise<void> {
  if (store.persist.hasHydrated()) return Promise.resolve()
  return new Promise((resolve) => {
    const unsub = store.persist.onFinishHydration(() => {
      unsub()
      resolve()
    })
  })
}
