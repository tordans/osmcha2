import { useHotkeys } from '@tanstack/react-hotkeys'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'
import { MapProvider } from 'react-map-gl/maplibre'
import { Changeset as ChangesetWorkspace } from '../components/changeset/Changeset.tsx'
import { SignIn } from '../components/sign_in.tsx'
import { FILTER_BY_USER } from '../config/bindings.ts'
import { useFilters } from '../hooks/useFilters.ts'
import { useChangesetMap } from '../query/hooks/useChangesetMap.ts'
import { changesetQueryOptions } from '../query/options/changeset.ts'
import { useAuthStore } from '../stores/authStore.ts'
import { useChangesetAdiffViewer } from './changesetAdiffViewer.ts'
import { ChangesetLoadError, ChangesetPending } from './changesetLoadStates.tsx'
import { CMap } from './map.tsx'

const changesetRouteApi = getRouteApi('/changesets/$id')

interface ChangesetData {
  properties?: {
    user?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

function Changeset() {
  const { id } = changesetRouteApi.useParams()
  const token = useAuthStore((state) => state.token)
  if (!token) return <SignIn />

  return <ChangesetSession key={id} changesetId={id} />
}

function ChangesetSession({ changesetId }: { changesetId: number }) {
  const { setFilters } = useFilters()
  const changesetQuery = useQuery(changesetQueryOptions(changesetId))
  const mapQuery = useChangesetMap(changesetId)
  const changeset = changesetQuery.data as ChangesetData | undefined

  const [selected, setSelected] = useState<unknown>(null)
  const [showElements, setShowElements] = useState<Array<string>>(['node', 'way', 'relation'])
  const [showActions, setShowActions] = useState<Array<string>>([
    'create',
    'modify',
    'delete',
    'noop',
  ])
  const viewer = useChangesetAdiffViewer(mapQuery.data?.adiff, showElements, showActions)

  function filterChangesetsByUser() {
    if (changeset?.properties) {
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

  if (changesetQuery.isPending) return <ChangesetPending />
  if (changesetQuery.isError) {
    return (
      <ChangesetLoadError
        error={changesetQuery.error}
        reset={() => void changesetQuery.refetch()}
      />
    )
  }

  return (
    <MapProvider>
      <ChangesetWorkspace
        changesetId={changesetId}
        currentChangeset={changeset}
        showElements={showElements}
        showActions={showActions}
        setShowElements={setShowElements}
        setShowActions={setShowActions}
        viewer={viewer}
        selected={selected}
        setSelected={setSelected}
      >
        <CMap
          changesetId={changesetId}
          imageryUsed={
            typeof changeset?.properties?.imagery_used === 'string'
              ? changeset.properties.imagery_used
              : null
          }
          viewer={viewer}
          setSelected={setSelected}
        />
      </ChangesetWorkspace>
    </MapProvider>
  )
}

export { Changeset }
