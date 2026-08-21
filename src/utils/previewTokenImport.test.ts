import { afterEach, describe, expect, it } from 'vitest'
import {
  getPreviewTokenImport,
  setPreviewTokenImport,
  subscribePreviewTokenImport,
} from './previewTokenImport.ts'

afterEach(() => {
  setPreviewTokenImport(false)
})

describe('previewTokenImport', () => {
  it('defaults to off and round-trips through sessionStorage', () => {
    expect(getPreviewTokenImport()).toBe(false)
    setPreviewTokenImport(true)
    expect(getPreviewTokenImport()).toBe(true)
    expect(sessionStorage.getItem('osmcha-preview-token-import')).toBe('1')
    setPreviewTokenImport(false)
    expect(getPreviewTokenImport()).toBe(false)
    expect(sessionStorage.getItem('osmcha-preview-token-import')).toBeNull()
  })

  it('notifies subscribers when the flag changes', () => {
    const seen: boolean[] = []
    const unsubscribe = subscribePreviewTokenImport(() => {
      seen.push(getPreviewTokenImport())
    })
    setPreviewTokenImport(true)
    setPreviewTokenImport(true)
    setPreviewTokenImport(false)
    unsubscribe()
    setPreviewTokenImport(true)
    expect(seen).toEqual([true, true, false])
  })
})
