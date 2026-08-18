import type { MapLibreAugmentedDiffViewer } from '@osmcha/maplibre-adiff-viewer'
import { useHotkeys } from '@tanstack/react-hotkeys'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type * as maplibre from 'maplibre-gl'
import { useRef, useState } from 'react'
import { Changeset as ChangesetWorkspace } from '../components/changeset/index.tsx'
import { FILTER_BY_USER } from '../config/bindings.ts'
import { useFilters } from '../hooks/useFilters.ts'
import { changesetQueryOptions } from '../query/options/changeset.ts'
import { CMap } from '../views/map.tsx'

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

  const [selected, setSelected] = useState<unknown>(null)
  const [showElements, setShowElements] = useState<Array<string>>(['node', 'way', 'relation'])
  const [showActions, setShowActions] = useState<Array<string>>([
    'create',
    'modify',
    'delete',
    'noop',
  ])

  const mapRef = useRef<{
    map: maplibre.Map
    adiffViewer: MapLibreAugmentedDiffViewer
  } | null>(null)

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
    <ChangesetWorkspace
      changesetId={changesetId}
      currentChangeset={changeset}
      showElements={showElements}
      showActions={showActions}
      setShowElements={setShowElements}
      setShowActions={setShowActions}
      mapRef={mapRef}
      selected={selected}
      setSelected={setSelected}
    >
      <CMap
        changesetId={changesetId}
        mapRef={mapRef}
        className="h-full w-full"
        showElements={showElements}
        showActions={showActions}
        setSelected={setSelected}
      />
    </ChangesetWorkspace>
  )
}

export { Changeset }
