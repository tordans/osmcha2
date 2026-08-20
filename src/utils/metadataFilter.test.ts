import { describe, expect, it } from 'vitest'
import {
  isSupportedMetadataQuery,
  joinMetadataFilterValue,
  metadataRowsToFilter,
  parseMetadataQuery,
  serializeMetadataRows,
  validateMetadataRow,
} from './metadataFilter.ts'

describe('joinMetadataFilterValue', () => {
  it('joins filter item values with commas', () => {
    expect(
      joinMetadataFilterValue([
        { label: 'hashtags=#hotosm-project', value: 'hashtags=#hotosm-project' },
        { label: 'changesets_count__max=50', value: 'changesets_count__max=50' },
      ]),
    ).toBe('hashtags=#hotosm-project,changesets_count__max=50')
  })
})

describe('parseMetadataQuery', () => {
  it('parses contains and max pairs', () => {
    const { rows, unsupported } = parseMetadataQuery(
      'hashtags=#hotosm-project,changesets_count__max=50',
    )
    expect(unsupported).toBe(false)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      key: 'hashtags',
      operator: 'contains',
      value: '#hotosm-project',
    })
    expect(rows[1]).toMatchObject({
      key: 'changesets_count',
      operator: 'max',
      value: '50',
    })
  })

  it('trims whitespace around comma-separated tokens', () => {
    const { rows } = parseMetadataQuery('changesets_count__min=101 , host=openstreetmap.org ')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({ key: 'changesets_count', operator: 'min', value: '101' })
    expect(rows[1]).toMatchObject({ key: 'host', operator: 'contains', value: 'openstreetmap.org' })
  })

  it('parses exists lookups', () => {
    const { rows } = parseMetadataQuery('locale=*')
    expect(rows).toEqual([
      expect.objectContaining({ key: 'locale', operator: 'exists', value: '' }),
    ])
  })

  it('parses exact lookups', () => {
    const { rows } = parseMetadataQuery('host__exact=https://www.openstreetmap.org/edit')
    expect(rows).toEqual([
      expect.objectContaining({
        key: 'host',
        operator: 'equals',
        value: 'https://www.openstreetmap.org/edit',
      }),
    ])
  })

  it('treats tokens without exactly one equals sign as unsupported', () => {
    expect(parseMetadataQuery('wrongtag')).toEqual({ rows: [], unsupported: true })
  })

  it('treats leftover non-pairs mixed with valid tokens as unsupported', () => {
    const { rows, unsupported } = parseMetadataQuery('hashtags=#hotosm,wrongtag')
    expect(unsupported).toBe(true)
    expect(rows[0]).toMatchObject({ key: 'hashtags', operator: 'contains', value: '#hotosm' })
  })

  it('returns no rows for empty input', () => {
    expect(parseMetadataQuery('')).toEqual({ rows: [], unsupported: false })
  })

  it('marks unsupported __contains lookups', () => {
    const { rows, unsupported } = parseMetadataQuery('host__contains=osm')
    expect(unsupported).toBe(true)
    expect(rows[0]).toMatchObject({ key: 'host', operator: 'contains', value: 'osm' })
  })
})

describe('serializeMetadataRows', () => {
  it('serializes valid rows without extra spaces', () => {
    expect(
      serializeMetadataRows([
        { id: '1', key: 'hashtags', operator: 'contains', value: '#hotosm-project' },
        { id: '2', key: 'changesets_count', operator: 'max', value: '50' },
      ]),
    ).toBe('hashtags=#hotosm-project,changesets_count__max=50')
  })

  it('skips invalid rows', () => {
    expect(
      serializeMetadataRows([
        { id: '1', key: '', operator: 'contains', value: 'x' },
        { id: '2', key: 'locale', operator: 'exists', value: '' },
      ]),
    ).toBe('locale=*')
  })
})

describe('metadataRowsToFilter', () => {
  it('returns one filter item per valid pair', () => {
    expect(
      metadataRowsToFilter([
        { id: '1', key: 'hashtags', operator: 'contains', value: '#hotosm-project' },
        { id: '2', key: 'changesets_count', operator: 'max', value: '50' },
      ]),
    ).toEqual([
      { label: 'hashtags=#hotosm-project', value: 'hashtags=#hotosm-project' },
      { label: 'changesets_count__max=50', value: 'changesets_count__max=50' },
    ])
  })

  it('returns undefined when no valid rows exist', () => {
    expect(
      metadataRowsToFilter([{ id: '1', key: '', operator: 'contains', value: '' }]),
    ).toBeUndefined()
  })
})

describe('validateMetadataRow', () => {
  it('requires integer values for min/max', () => {
    expect(
      validateMetadataRow({ id: '1', key: 'changesets_count', operator: 'max', value: '50' }),
    ).toBeNull()
    expect(
      validateMetadataRow({ id: '1', key: 'changesets_count', operator: 'max', value: '50.5' }),
    ).toMatch(/whole number/)
  })

  it('rejects commas in values', () => {
    expect(
      validateMetadataRow({ id: '1', key: 'host', operator: 'contains', value: 'a,b' }),
    ).toMatch(/commas/)
  })

  it('rejects equals signs in values', () => {
    expect(
      validateMetadataRow({ id: '1', key: 'host', operator: 'contains', value: 'a=b' }),
    ).toMatch(/=/)
  })
})

describe('isSupportedMetadataQuery', () => {
  it('accepts supported lookups', () => {
    expect(isSupportedMetadataQuery('hashtags=#hotosm,changesets_count__max=50')).toBe(true)
    expect(isSupportedMetadataQuery('locale=*')).toBe(true)
    expect(isSupportedMetadataQuery('host__exact=https://example.org')).toBe(true)
  })

  it('rejects unsupported __contains lookups', () => {
    expect(isSupportedMetadataQuery('host__contains=osm')).toBe(false)
  })

  it('rejects strings that are not key=value pairs', () => {
    expect(isSupportedMetadataQuery('wrongtag')).toBe(false)
    expect(isSupportedMetadataQuery('locale=en,wrongtag')).toBe(false)
  })
})
