import { describe, expect, test } from 'vitest'
import { AdiffNotFoundError } from '../../network/changeset.ts'
import { changesetMapFromOverpassQueryOptions, changesetMapQueryOptions } from './changeset.ts'

type RetryFn = (failureCount: number, error: unknown) => boolean

function retryOf(options: { retry?: unknown }): RetryFn {
  if (typeof options.retry !== 'function') throw new Error('expected a retry function')
  return options.retry as RetryFn
}

describe('changesetMapQueryOptions retry', () => {
  test('does not retry a missing augmented diff', () => {
    const retry = retryOf(changesetMapQueryOptions(1))
    expect(retry(0, new AdiffNotFoundError(1, 404, 'Not Found'))).toBe(false)
  })

  test('retries other failures up to three times', () => {
    const retry = retryOf(changesetMapQueryOptions(1))
    expect(retry(0, new Error('network down'))).toBe(true)
    expect(retry(2, new Error('network down'))).toBe(true)
    expect(retry(3, new Error('network down'))).toBe(false)
  })
})

describe('changesetMapFromOverpassQueryOptions', () => {
  test('is keyed by changeset and never retried automatically', () => {
    const options = changesetMapFromOverpassQueryOptions(7)
    expect(options.queryKey).toEqual(['changesetMapOverpass', 7])
    expect(options.retry).toBe(false)
  })
})
