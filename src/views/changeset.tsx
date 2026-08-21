import { useHotkeys } from '@tanstack/react-hotkeys'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'
import { MapProvider } from 'react-map-gl/maplibre'
import { Changeset as ChangesetWorkspace } from '../components/changeset/Changeset.tsx'
import { FILTER_BY_USER } from '../config/bindings.ts'
import { useFilters } from '../hooks/useFilters.ts'
import { useChangesetMap } from '../query/hooks/useChangesetMap.ts'
import { changesetQueryOptions } from '../query/options/changeset.ts'
import { useChangesetAdiffViewer } from './changesetAdiffViewer.ts'
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
  const changesetId = id

  return <ChangesetSession key={changesetId ?? 'none'} changesetId={changesetId} />
}

function ChangesetSession({ changesetId }: { changesetId: number }) {
  const { setFilters } = useFilters()
  const { data: currentChangeset } = useSuspenseQuery(changesetQueryOptions(changesetId))
  const changeset = currentChangeset as ChangesetData | undefined
  const mapQuery = useChangesetMap(changesetId)

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
