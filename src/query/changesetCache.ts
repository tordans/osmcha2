import type { QueryClient } from '@tanstack/react-query'
import type { ChangesetFeature, ChangesetProperties } from '../network/changeset.ts'
import type { ChangesetsPage } from '../network/changesets_page.ts'

export function changesetDetailKey(changesetId: number) {
  return ['changeset', changesetId] as const
}

/** Prefix of every loaded list page, whatever its filters. */
const changesetPagesKey = ['changesets', 'page'] as const

/** What to change in a changeset's properties; it gets the current ones of that changeset. */
export type ChangesetPropertiesPatch = (
  properties: ChangesetProperties,
) => Partial<ChangesetProperties>

export function patchChangesetFeature(
  feature: ChangesetFeature,
  patch: ChangesetPropertiesPatch,
): ChangesetFeature {
  return { ...feature, properties: { ...feature.properties, ...patch(feature.properties) } }
}

/** Patches the one feature with this id; every other feature and the page stay as they are. */
export function patchChangesetsPage(
  page: ChangesetsPage,
  changesetId: number,
  patch: ChangesetPropertiesPatch,
): ChangesetsPage {
  return {
    ...page,
    features: page.features.map((feature) =>
      feature.id === changesetId ? patchChangesetFeature(feature, patch) : feature,
    ),
  }
}

/**
 * Shows a change to a changeset right away, in the detail and in every loaded list page. Returns
 * `restore()`, which puts both back as they were before. Call it when the request fails.
 */
export async function patchChangesetProperties(
  queryClient: QueryClient,
  changesetId: number,
  patch: ChangesetPropertiesPatch,
) {
  const detailKey = changesetDetailKey(changesetId)
  await Promise.all([
    queryClient.cancelQueries({ queryKey: detailKey }),
    queryClient.cancelQueries({ queryKey: changesetPagesKey }),
  ])

  const previousDetail = queryClient.getQueryData<ChangesetFeature>(detailKey)
  const previousPages = queryClient.getQueriesData<ChangesetsPage>({ queryKey: changesetPagesKey })

  queryClient.setQueryData<ChangesetFeature>(detailKey, (old) =>
    old ? patchChangesetFeature(old, patch) : old,
  )
  queryClient.setQueriesData<ChangesetsPage>({ queryKey: changesetPagesKey }, (old) =>
    old ? patchChangesetsPage(old, changesetId, patch) : old,
  )

  return {
    restore: () => {
      if (previousDetail) queryClient.setQueryData(detailKey, previousDetail)
      for (const [key, page] of previousPages) {
        if (page) queryClient.setQueryData(key, page)
      }
    },
  }
}
