import presets from '@openstreetmap/id-tagging-schema/dist/presets.min.json'
import translations from '@openstreetmap/id-tagging-schema/dist/translations/en.min.json'
import { describe, expect, it } from 'vitest'
import data from './data/matching-presets.json'
import { buildMatchingData } from './generate.ts'

describe('buildMatchingData', () => {
  it('is what the committed file holds: after a bump of id-tagging-schema run `bun run generate-presets`', () => {
    expect(buildMatchingData(presets, translations)).toEqual(data)
  })

  it('resolves the name of a preset that refers to another preset', () => {
    const records = buildMatchingData(
      {
        a: { tags: { x: 'y' }, geometry: ['point'] },
        b: { tags: { x: 'z' }, geometry: ['point'] },
      },
      { en: { presets: { presets: { a: { name: '{b}' }, b: { name: 'Bee' } } } } },
    )
    expect(records.map((record) => record.name)).toEqual(['Bee', 'Bee'])
  })

  it('leaves out presets that are disabled everywhere and presets without a geometry', () => {
    const records = buildMatchingData(
      {
        '@templates/poi': {
          tags: { '@template': 'yes' },
          geometry: ['point'],
          locationSet: { include: ['Planet'], exclude: ['Planet'] },
        },
        nothing: { tags: { x: 'y' } },
        kept: { tags: { x: 'y' }, geometry: ['point'], locationSet: { include: ['de'] } },
      },
      { en: { presets: { presets: {} } } },
    )
    expect(records.map((record) => record.id)).toEqual(['kept'])
  })

  it('has every preset of the schema that can match', () => {
    const ids = new Set(Object.keys(presets))
    const kept = new Set(data.map((record) => record.id))
    const left = [...ids].filter((id) => !kept.has(id))
    expect(left.every((id) => id.startsWith('@templates/'))).toBe(true)
    expect(data.length).toBeGreaterThan(1700)
  })
})
