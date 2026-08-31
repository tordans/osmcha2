import { useHotkeys } from '@tanstack/react-hotkeys'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'
import { MapProvider } from 'react-map-gl/maplibre'
import { Changeset as ChangesetWorkspace } from '../components/changeset/Changeset.tsx'
import {
  actionMatchingRef,
  refDeepLinkKey,
  searchWithRef,
  searchWithRefAndPin,
} from '../components/changeset/refSelection.ts'
import { SignIn } from '../components/sign_in.tsx'
import { FILTER_BY_USER } from '../config/bindings.ts'
import { useFilters } from '../hooks/useFilters.ts'
import type { NoteTarget } from '../notes/discussionNotes.ts'
import { useChangesetMap } from '../query/hooks/useChangesetMap.ts'
import { changesetQueryOptions } from '../query/options/changeset.ts'
import { parseLayersParam } from '../routing/layersParam.ts'
import { parseRefParam, type RefParam } from '../routing/refParam.ts'
import { useAuthStore } from '../stores/authStore.ts'
import { useChangesetAdiffViewer } from './changesetAdiffViewer.ts'
import { CMap } from './map.tsx'

const changesetRouteApi = getRouteApi('/changesets/$id')

function Changeset() {
  const { id } = changesetRouteApi.useParams()
  const token = useAuthStore((state) => state.token)
  if (!token) return <SignIn />

  return <ChangesetSession key={id} changesetId={id} />
}

function ChangesetSession({ changesetId }: { changesetId: number }) {
  const { setFilters } = useFilters()
  const search = changesetRouteApi.useSearch()
  const navigate = changesetRouteApi.useNavigate()
  const { data: changeset } = useSuspenseQuery(changesetQueryOptions(changesetId))
  const mapQuery = useChangesetMap(changesetId)
  const [inAppDeepLinkKey, setInAppDeepLinkKey] = useState<string | null>(null)
  const [revealNonce, setRevealNonce] = useState(0)
  const [revealTarget, setRevealTarget] = useState<NoteTarget | null>(null)

  const mapLayers = parseLayersParam(search.layers)
  const viewer = useChangesetAdiffViewer(
    mapQuery.data?.adiff,
    mapLayers.showElements,
    mapLayers.showActions,
  )
  const selectedRef = parseRefParam(search.ref ?? '')
  const selected = actionMatchingRef(viewer?.adiff.actions ?? [], selectedRef)

  function selectRef(ref: RefParam | null) {
    setRevealTarget(null)
    setInAppDeepLinkKey(refDeepLinkKey(changesetId, ref, search.pin))
    void navigate({
      search: (prev) => searchWithRef(prev, ref),
      replace: true,
    })
  }

  /** Deep-link without marking in-app, so the one-shot reveal (tab, sheet, scroll, flash, zoom) still runs. */
  function revealRef(target: NoteTarget) {
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
          selectRef={selectRef}
          inAppDeepLinkKey={inAppDeepLinkKey}
        />
      </ChangesetWorkspace>
    </MapProvider>
  )
}

export { Changeset }
