import { describe, expect, it } from 'vitest'
import {
  BACKGROUND_GROUPS,
  backgroundGroup,
  buildImageryRows,
  groupRows,
  rowIsShown,
  type ImageryListLayer,
} from './imageryRows.ts'

function layer(
  id: string,
  name: string,
  extra: Partial<ImageryListLayer> & { label?: string; order?: number; series?: string } = {},
): ImageryListLayer {
  const { label, order, series, ...rest } = extra
  return {
    id,
    name,
    best: false,
    category: 'photo',
    continents: ['europe'],
    group:
      label === undefined
        ? undefined
        : {
            id: series ?? 'berlin-dop',
            name: 'Berlin/Geoportal DOP20RGB',
            label,
            order: order ?? 0,
          },
    ...rest,
  }
}

const berlin = [
  layer('Berlin-2024', 'Berlin/Geoportal DOP20RGB (2024)', { label: '2024', order: 1 }),
  layer('Berlin-2025', 'Berlin/Geoportal DOP20RGB (2025)', { label: '2025', order: 2 }),
  layer('Berlin-2026', 'Berlin/Geoportal DOP20RGB (2026)', {
    label: '2026',
    order: 3,
    best: true,
  }),
]

describe('backgroundGroup', () => {
  it('files aerial photos by their reach and the rest by category', () => {
    expect(backgroundGroup('photo', false)).toBe('local-photo')
    expect(backgroundGroup('photo', true)).toBe('global-photo')
    expect(backgroundGroup('map', false)).toBe('maps')
    expect(backgroundGroup('osmbasedmap', false)).toBe('maps')
    expect(backgroundGroup('historicmap', false)).toBe('historic')
    expect(backgroundGroup('historicphoto', false)).toBe('historic')
    expect(backgroundGroup('elevation', false)).toBe('elevation')
    expect(backgroundGroup('qa', false)).toBe('other')
    expect(backgroundGroup('other', false)).toBe('other')
    expect(backgroundGroup(undefined, false)).toBe('other')
  })
})

describe('groupRows', () => {
  it('keeps the order of the groups, drops empty ones and keeps the rows in order', () => {
    const rows = [
      { id: 'a', group: 'other' as const },
      { id: 'b', group: 'local-photo' as const },
      { id: 'c', group: 'other' as const },
    ]
    expect(groupRows(rows).map((group) => [group.label, group.rows.map((row) => row.id)])).toEqual([
      ['Local aerial imagery', ['b']],
      ['Other', ['a', 'c']],
    ])
    expect(BACKGROUND_GROUPS.map((group) => group.id)).toEqual([
      'local-photo',
      'global-photo',
      'maps',
      'historic',
      'elevation',
      'other',
    ])
  })
})

describe('buildImageryRows', () => {
  it('shows a series once, with its dates newest first', () => {
    const rows = buildImageryRows(berlin)
    expect(rows).toHaveLength(1)
    const [row] = rows
    expect(row?.name).toBe('Berlin/Geoportal DOP20RGB')
    expect(row?.chips.map((chip) => chip.label)).toEqual(['2026', '2025', '2024'])
    expect(row?.chips.map((chip) => chip.styleId)).toEqual([
      'eli:Berlin-2026',
      'eli:Berlin-2025',
      'eli:Berlin-2024',
    ])
  })

  it('marks the best date and picks it with a click on the row', () => {
    const [row] = buildImageryRows(berlin)
    expect(row?.best).toBe(true)
    expect(row?.styleId).toBe('eli:Berlin-2026')
    expect(row?.chips.filter((chip) => chip.best).map((chip) => chip.label)).toEqual(['2026'])
  })

  it('picks the newest date when none is best', () => {
    const [row] = buildImageryRows(berlin.map((entry) => ({ ...entry, best: false })))
    expect(row?.best).toBe(false)
    expect(row?.styleId).toBe('eli:Berlin-2026')
  })

  it('is one row without chips for a layer that is no series', () => {
    const rows = buildImageryRows([layer('Solo', 'Solo Orthophoto')])
    expect(rows).toHaveLength(1)
    expect(rows[0]?.chips).toEqual([])
    expect(rows[0]?.styleId).toBe('eli:Solo')
  })

  it('sorts best rows first, then by name', () => {
    const rows = buildImageryRows([
      layer('b', 'Beta Ortho'),
      layer('z', 'Zeta Ortho', { best: true }),
      layer('a', 'Alpha Ortho'),
    ])
    expect(rows.map((row) => row.name)).toEqual(['Zeta Ortho', 'Alpha Ortho', 'Beta Ortho'])
  })

  it('files a row by its newest date and worldwide layers as global', () => {
    const rows = buildImageryRows([
      layer('w', 'World Ortho', { continents: ['world'] }),
      layer('m', 'Old Map', { category: 'historicmap' }),
      ...berlin,
    ])
    expect(Object.fromEntries(rows.map((row) => [row.name, row.group]))).toEqual({
      'World Ortho': 'global-photo',
      'Old Map': 'historic',
      'Berlin/Geoportal DOP20RGB': 'local-photo',
    })
  })

  it('marks the date the changeset used, picks it with the row and leaves the others', () => {
    const [row] = buildImageryRows(berlin, new Set(['eli:Berlin-2025']))
    expect(row?.used).toBe(true)
    expect(row?.usedOtherDate).toBe(false)
    expect(row?.styleId).toBe('eli:Berlin-2025')
    expect(row?.chips.map((chip) => [chip.label, chip.used])).toEqual([
      ['2026', false],
      ['2025', true],
      ['2024', false],
    ])
  })

  it('says when only another date of the series was used', () => {
    const [row] = buildImageryRows(berlin, new Set(), new Set(['eli:Berlin-2024']))
    expect(row?.used).toBe(false)
    expect(row?.usedOtherDate).toBe(true)
    expect(row?.styleId).toBe('eli:Berlin-2026')
    const [exact] = buildImageryRows(
      berlin,
      new Set(['eli:Berlin-2025']),
      new Set(['eli:Berlin-2024']),
    )
    expect(exact?.usedOtherDate).toBe(false)
  })

  it('does not mark unrelated rows', () => {
    const rows = buildImageryRows([layer('Solo', 'Solo Orthophoto'), ...berlin], new Set(['eli:x']))
    expect(rows.every((row) => !row.used && !row.usedOtherDate)).toBe(true)
  })
})

describe('rowIsShown', () => {
  it('is true while any date of the row is drawn', () => {
    const [row] = buildImageryRows(berlin)
    expect(row && rowIsShown(row, 'eli:Berlin-2024')).toBe(true)
    expect(row && rowIsShown(row, 'bing')).toBe(false)
    const [solo] = buildImageryRows([layer('Solo', 'Solo Orthophoto')])
    expect(solo && rowIsShown(solo, 'eli:Solo')).toBe(true)
  })
})
