import { afterEach, describe, expect, it, vi } from 'vitest'
import { safeJSONStorage } from './persistStorage.ts'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('safeJSONStorage', () => {
  it('treats a corrupt value as missing instead of throwing', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    localStorage.setItem('key', '{not json')
    expect(safeJSONStorage().getItem('key')).toBeNull()
  })

  it('keeps going when a write hits the quota', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    expect(() => safeJSONStorage().setItem('key', { state: {}, version: 0 })).not.toThrow()
  })

  it('reads the legacy key while the new one is empty, and leaves it in place', () => {
    localStorage.setItem('auth', JSON.stringify({ state: { token: 't' }, version: 0 }))
    const storage = safeJSONStorage<{ token: string }>({ legacyName: 'auth' })
    expect(storage.getItem('osmcha2-auth')).toEqual({ state: { token: 't' }, version: 0 })
    storage.setItem('osmcha2-auth', { state: { token: 'u' }, version: 0 })
    expect(storage.getItem('osmcha2-auth')).toEqual({ state: { token: 'u' }, version: 0 })
    expect(localStorage.getItem('auth')).not.toBeNull()
  })
})
