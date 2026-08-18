import type { MapLibreAugmentedDiffViewer } from '@osmcha/maplibre-adiff-viewer'
import { getRouteApi } from '@tanstack/react-router'
import type * as maplibre from 'maplibre-gl'
import Mousetrap from 'mousetrap'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { Changeset as ChangesetWorkspace } from '../components/changeset/index.tsx'
import { FILTER_BY_USER } from '../config/bindings.ts'
import { useFilters } from '../hooks/useFilters.ts'
import { useChangeset } from '../query/hooks/useChangeset.ts'
import { showToast } from '../utils/toast.ts'
import { CMap } from '../views/map.tsx'

const changesetRouteApi = getRouteApi('/changesets/$id')

interface ChangesetData {
  properties?: {
    user?: string
    [key: string]: any
  }
  [key: string]: any
}

function Changeset() {
  const { id } = changesetRouteApi.useParams()
  const changesetId = id

  return <ChangesetSession key={changesetId ?? 'none'} changesetId={changesetId} />
}

function ChangesetSession({ changesetId }: { changesetId: number }) {
  const { setFilters } = useFilters()
  const { data: currentChangeset, error } = useChangeset(changesetId)
  const changeset = currentChangeset as ChangesetData | undefined

  const [camera, setCamera] = useState<any>(null)
  const [selected, setSelected] = useState<any>(null)
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

  const onFilterChangesetsByUser = useEffectEvent(filterChangesetsByUser)

  useEffect(function bindFilterByUserShortcut() {
    Mousetrap.bind(FILTER_BY_USER.bindings, onFilterChangesetsByUser)
    return function unbindFilterByUserShortcut() {
      for (const k of FILTER_BY_USER.bindings) {
        Mousetrap.unbind(k)
      }
    }
  }, [])

  useEffect(
    function toastChangesetLoadError() {
      if (!error) return
      showToast({
        kind: 'error',
        title: `changeset:${changesetId} failed to load`,
        description: 'Try reloading osmcha',
      })
      console.error(error)
    },
    [error, changesetId],
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
      camera={camera}
    >
      <CMap
        changesetId={changesetId}
        mapRef={mapRef}
        className="h-full w-full"
        showElements={showElements}
        showActions={showActions}
        setSelected={setSelected}
        setCamera={setCamera}
      />
    </ChangesetWorkspace>
  )
}

export { Changeset }
