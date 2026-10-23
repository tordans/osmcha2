import { describe, expect, test } from 'vitest'
import { createPendingCamera } from './pendingCamera.ts'

describe('createPendingCamera', () => {
  test('is empty until a move is deferred', () => {
    const pending = createPendingCamera<string>()
    expect(pending.take()).toBeNull()
  })

  test('keeps only the latest move', () => {
    const pending = createPendingCamera<string>()
    pending.defer('first')
    pending.defer('second')
    expect(pending.take()).toBe('second')
  })

  test('take empties the queue', () => {
    const pending = createPendingCamera<string>()
    pending.defer('move')
    pending.take()
    expect(pending.take()).toBeNull()
  })

  test('clear drops a deferred move', () => {
    const pending = createPendingCamera<string>()
    pending.defer('move')
    pending.clear()
    expect(pending.take()).toBeNull()
  })
})
