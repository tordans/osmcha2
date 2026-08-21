const STORAGE_KEY = 'osmcha-preview-token-import'

const listeners = new Set<() => void>()

function notifyPreviewTokenImportListeners() {
  for (const listener of listeners) listener()
}

/** sessionStorage flag used by the local debug chip. Always false if storage is unavailable. */
export function getPreviewTokenImport(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function setPreviewTokenImport(enabled: boolean): void {
  try {
    if (enabled) sessionStorage.setItem(STORAGE_KEY, '1')
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    return
  }
  notifyPreviewTokenImportListeners()
}

export function subscribePreviewTokenImport(listener: () => void): () => void {
  listeners.add(listener)
  return function unsubscribePreviewTokenImport() {
    listeners.delete(listener)
  }
}
