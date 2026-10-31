import { useHotkeys } from '@tanstack/react-hotkeys'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { MapProvider } from 'react-map-gl/maplibre'
import { Changeset as ChangesetWorkspace } from '../components/changeset/Changeset.tsx'
import { buildElementChanges } from '../components/changeset/changesetElements.ts'
import { minorMoveObjectKeys } from '../components/changeset/minorMoves.ts'
import {
  actionMatchingRef,
  refDeepLinkKey,
  searchWithRef,
  searchWithRefAndPin,
} from '../components/changeset/refSelection.ts'
import { tagGroupsOf } from '../components/changeset/tagGroups.ts'
import { SignIn } from '../components/sign_in.tsx'
import { FILTER_BY_USER } from '../config/bindings.ts'
import { useFilters } from '../hooks/useFilters.ts'
import type { NoteTarget } from '../notes/discussionNotes.ts'
import { useChangesetMap, useChangesetMapFromOverpass } from '../query/hooks/useChangesetMap.ts'
import { changesetQueryOptions } from '../query/options/changeset.ts'
import { parseLayersParam } from '../routing/layersParam.ts'
import { parseRefParam, type RefParam } from '../routing/refParam.ts'
import { useAuthToken } from '../stores/auth-store.ts'
import { useChangesetHoverActions } from '../stores/changeset-hover-store.ts'
import { useReadChangesetsActions } from '../stores/read-changesets-store.ts'
import { useReviewFocusActions } from '../stores/review-focus-store.ts'
import { getStreetImageryViewerActions } from '../stores/street-imagery-viewer-store.ts'
import { useChangesetAdiffViewer } from './changesetAdiffViewer.ts'
import { changesetWorkAreas } from './changesetWorkAreas.ts'
import { CMap } from './map.tsx'

const changesetRouteApi = getRouteApi('/changesets/$id')

function Changeset() {
  const { id } = changesetRouteApi.useParams()
  const token = useAuthToken()
  if (!token) return <SignIn />

  return <ChangesetSession key={id} changesetId={id} />
}

function ChangesetSession({ changesetId }: { changesetId: number }) {
  const { setFilters } = useFilters()
  const search = changesetRouteApi.useSearch()
  const navigate = changesetRouteApi.useNavigate()
  const { data: changeset } = useSuspenseQuery(changesetQueryOptions(changesetId))
  const mapQuery = useChangesetMap(changesetId)
  // Only has data after the user asked for the Overpass fallback in the map pane.
  const overpassMapQuery = useChangesetMapFromOverpass(changesetId)
  const [inAppDeepLinkKey, setInAppDeepLinkKey] = useState<string | null>(null)
  const [revealNonce, setRevealNonce] = useState(0)
  const [revealTarget, setRevealTarget] = useState<NoteTarget | null>(null)
  const { markRead } = useReadChangesetsActions()
  const { setGroupCursor } = useReviewFocusActions()
  const { clearListScrollTarget } = useChangesetHoverActions()

  useEffect(
    function markChangesetRead() {
      markRead(changesetId)
    },
    [changesetId, markRead],
  )

  useEffect(
    function clearCursorOnLeave() {
      return function clearCursor() {
        setGroupCursor(null)
        // Otherwise the review column of the next changeset would act on it when it mounts.
        clearListScrollTarget()
        // The photo window leaves the list usable; its photo belongs to this changeset's place.
        getStreetImageryViewerActions().close()
      }
    },
    [setGroupCursor, clearListScrollTarget],
  )

  const mapLayers = parseLayersParam(search.layers)
  const viewer = useChangesetAdiffViewer(
    (mapQuery.data ?? overpassMapQuery.data)?.adiff,
    mapLayers.showElements,
    mapLayers.showActions,
  )
  // Stable identity: the map refits to the first area whenever it changes.
  const workAreas = useMemo(
    () =>
      viewer
        ? changesetWorkAreas(
            viewer.geojson.features,
            new Set(minorMoveObjectKeys(buildElementChanges(viewer.adiff.actions))),
          )
        : [],
    [viewer],
  )
  // Same grouping as the Changes list, so the map names a group by the code the list shows.
  const tagGroups = tagGroupsOf(buildElementChanges(viewer?.adiff.actions), workAreas)
  const selectedRef = parseRefParam(search.ref ?? '')
  const selectedKey = selectedRef ? `${selectedRef.type}/${selectedRef.id}` : null
  const selected = actionMatchingRef(viewer?.adiff.actions ?? [], selectedRef)

  // Back and forward change the URL without `selectRef`; a selected row is the cursor then.
  useEffect(
    function clearGroupCursorOnSelection() {
      if (selectedKey != null) setGroupCursor(null)
    },
    [selectedKey, setGroupCursor],
  )

  function selectRef(ref: RefParam | null) {
    setGroupCursor(null)
    setRevealTarget(null)
    setInAppDeepLinkKey(refDeepLinkKey(changesetId, ref, search.pin))
    void navigate({
      search: (prev) => searchWithRef(prev, ref),
      replace: true,
    })
  }

  /** Deep-link without marking in-app, so the one-shot reveal (tab, sheet, scroll, flash, zoom) still runs. */
  function revealRef(target: NoteTarget) {
    setGroupCursor(null)
    setInAppDeepLinkKey(null)
    setRevealTarget(target)
    setRevealNonce((nonce) => nonce + 1)
    void navigate({
      search: (prev) => searchWithRefAndPin(prev, target.ref ?? null, target.pin ?? null),
      replace: true,
    })
  }

  function filterChangesetsByUser() {
    if (changeset.properties) {
      const userName = changeset.properties.user
      setFilters({
        users: [
          {
            label: userName,
            value: userName,
          },
        ],
      })
    }
  }

  useHotkeys(
    FILTER_BY_USER.hotkeys.map((hotkey) => ({
      hotkey,
      callback: filterChangesetsByUser,
    })),
  )

  return (
    <MapProvider>
      <ChangesetWorkspace
        changesetId={changesetId}
        currentChangeset={changeset}
        viewer={viewer}
        workAreas={workAreas}
        selected={selected}
        selectedRef={selectedRef}
        selectRef={selectRef}
        revealRef={revealRef}
        pinSearch={search.pin}
        inAppDeepLinkKey={inAppDeepLinkKey}
        revealNonce={revealNonce}
        revealTarget={revealTarget}
      >
        <CMap
          changesetId={changesetId}
          imageryUsed={
            typeof changeset.properties?.imagery_used === 'string'
              ? changeset.properties.imagery_used
              : null
          }
          viewer={viewer}
          workAreas={workAreas}
          tagGroups={tagGroups}
          selectRef={selectRef}
          inAppDeepLinkKey={inAppDeepLinkKey}
        />
      </ChangesetWorkspace>
    </MapProvider>
  )
}

export { Changeset }
