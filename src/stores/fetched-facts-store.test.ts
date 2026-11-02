import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { parseFetchedEntries } from './fetched-facts-store.ts'

const options = { factsSchema: z.object({ label: z.string() }), maxAgeMs: 100, now: 1000 }
const facts = { label: 'Berlin' }

describe('parseFetchedEntries', () => {
  it('keeps what is younger than the limit and drops the rest', () => {
    const fresh = { fetchedAt: 901, facts, open: false }
    const old = { fetchedAt: 900, facts, open: true }
    expect(parseFetchedEntries({ entries: { a: fresh, b: old } }, options)).toEqual({
      entries: { a: fresh },
    })
  })

  it('opens an entry without a stored state', () => {
    const { entries } = parseFetchedEntries({ entries: { a: { fetchedAt: 950, facts } } }, options)
    expect(entries.a?.open).toBe(true)
  })

  it('drops an entry that does not fit, and never throws on junk', () => {
    const wrong = { fetchedAt: 950, facts: { label: 1 } }
    expect(parseFetchedEntries({ entries: { a: wrong } }, options)).toEqual({ entries: {} })
    for (const junk of [undefined, null, 'x', 7, []]) {
      expect(parseFetchedEntries(junk, options)).toEqual({ entries: {} })
    }
  })
})
