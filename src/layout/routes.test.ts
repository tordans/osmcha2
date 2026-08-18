import { describe, expect, test } from 'vitest'
import { isChangesetPath, isFullBleedPath, isListHomePath } from './routes.ts'

describe('layout routes', () => {
  test('treats list home and changeset pages as full-bleed', () => {
    expect(isListHomePath('/')).toBe(true)
    expect(isListHomePath('/filters')).toBe(false)
    expect(isChangesetPath('/changesets/123')).toBe(true)
    expect(isChangesetPath('/changesets/')).toBe(false)
    expect(isChangesetPath('/changesets/123/extra')).toBe(false)
    expect(isFullBleedPath('/')).toBe(true)
    expect(isFullBleedPath('/changesets/99')).toBe(true)
    expect(isFullBleedPath('/filters')).toBe(false)
    expect(isFullBleedPath('/user')).toBe(false)
  })
})
