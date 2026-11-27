import { QueryClient } from '@tanstack/react-query'
import { describe, expect, test } from 'vitest'
import type { ChangesetFeature } from '../network/changeset.ts'
import type { ChangesetsPage } from '../network/changesets_page.ts'
import {
  changesetDetailKey,
  patchChangesetFeature,
  patchChangesetProperties,
  patchChangesetsPage,
} from './changesetCache.ts'

function feature(id: number, overrides: Partial<ChangesetFeature['properties']> = {}) {
  return {
    id,
    geometry: null,
    properties: {
      user: 'mapper',
      reasons: [],
      tags: [],
      features: [],
      reviewed_features: [],
      is_suspect: false,
      harmful: null,
      checked: false,
      ...overrides,
    },
  } satisfies ChangesetFeature
}

function page(...features: ChangesetFeature[]): ChangesetsPage {
  return { count: features.length, features }
}

const markChecked = () => ({ checked: true, harmful: false })

describe('patchChangesetFeature', () => {
  test('merges the patch into the properties and keeps the input unchanged', () => {
    const before = feature(1)
    const after = patchChangesetFeature(before, markChecked)
    expect(after.properties).toMatchObject({ checked: true, harmful: false, user: 'mapper' })
    expect(before.properties.checked).toBe(false)
  })

  test('hands the current properties to the patch', () => {
    const before = feature(1, { tags: [{ id: 3, name: 'three' }] })
    const after = patchChangesetFeature(before, (p) => ({
      tags: [...p.tags, { id: 4, name: 'four' }],
    }))
    expect(after.properties.tags.map((t) => t.id)).toEqual([3, 4])
  })
})

describe('patchChangesetsPage', () => {
  test('patches only the feature with this id', () => {
    const result = patchChangesetsPage(page(feature(1), feature(2)), 2, markChecked)
    expect(result.features.map((f) => f.properties.checked)).toEqual([false, true])
    expect(result.count).toBe(2)
  })

  test('keeps the page as it is when the changeset is not on it', () => {
    const result = patchChangesetsPage(page(feature(1)), 9, markChecked)
    expect(result.features[0]?.properties.checked).toBe(false)
  })
})

describe('patchChangesetProperties', () => {
  const pageKey = ['changesets', 'page', 0, {}, null]

  test('patches the detail and the list pages, and restore puts both back', async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(changesetDetailKey(1), feature(1))
    queryClient.setQueryData(pageKey, page(feature(1), feature(2)))

    const { restore } = await patchChangesetProperties(queryClient, 1, markChecked)

    expect(
      queryClient.getQueryData<ChangesetFeature>(changesetDetailKey(1))?.properties.checked,
    ).toBe(true)
    expect(
      queryClient.getQueryData<ChangesetsPage>(pageKey)?.features.map((f) => f.properties.checked),
    ).toEqual([true, false])

    restore()

    expect(
      queryClient.getQueryData<ChangesetFeature>(changesetDetailKey(1))?.properties.checked,
    ).toBe(false)
    expect(
      queryClient.getQueryData<ChangesetsPage>(pageKey)?.features.map((f) => f.properties.checked),
    ).toEqual([false, false])
  })

  test('does not create a detail or page that was not loaded', async () => {
    const queryClient = new QueryClient()
    const { restore } = await patchChangesetProperties(queryClient, 1, markChecked)
    restore()
    expect(queryClient.getQueryData(changesetDetailKey(1))).toBeUndefined()
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
  })
})
