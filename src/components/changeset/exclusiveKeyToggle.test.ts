import { describe, expect, it } from 'vitest'
import { exclusiveKeyToggleState } from './exclusiveKeyToggle.ts'

const options = [{ label: 'details' }, { label: 'discussions' }] as const

describe('exclusiveKeyToggleState', () => {
  it('turns the chosen panel on and the others off', () => {
    expect(
      exclusiveKeyToggleState(options, { details: true, discussions: false }, 'discussions'),
    ).toEqual({
      details: false,
      discussions: true,
    })
  })

  it('turns the chosen panel off when it is already on', () => {
    expect(
      exclusiveKeyToggleState(options, { details: true, discussions: false }, 'details'),
    ).toEqual({
      details: false,
      discussions: false,
    })
  })
})
