import { describe, expect, it } from 'vitest'
import { isMissingCredentialsError, MISSING_CREDENTIALS_MESSAGE } from './request.ts'

describe('isMissingCredentialsError', () => {
  it('matches the Django unauthenticated detail string', () => {
    expect(isMissingCredentialsError(new Error(MISSING_CREDENTIALS_MESSAGE))).toBe(true)
    expect(isMissingCredentialsError(new Error('Invalid token.'))).toBe(false)
    expect(isMissingCredentialsError('nope')).toBe(false)
  })
})
