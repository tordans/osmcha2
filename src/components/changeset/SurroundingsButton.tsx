import clsx from 'clsx'
import { useMemo } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import {
  SURROUNDINGS_MAX_AGE_MS,
  useLoadSurroundings,
  useSurroundingsBoxes,
} from '../../query/hooks/useSurroundings.ts'
import { useMapLoaded } from '../../stores/map-loaded-store.ts'
import { useGroupCursorKey } from '../../stores/review-focus-store.ts'
import type { ChangesetAdiffViewer } from '../../views/changesetAdiffViewer.ts'
import type { WorkArea } from '../../views/changesetWorkAreas.ts'
import {
  boxesFor,
  MAX_BOXES_PER_CLICK,
  missingPoints,
  pointsByElement,
} from '../../views/surroundingsBoxes.ts'
import { changesetFeatureIndex } from '../../views/tagGroupFeatures.ts'
import { useMapView } from '../../views/useMapView.ts'
import { LoaderCircleIcon, SurroundingsIcon } from '../ui/icons.ts'
import { Tooltip } from '../ui/tooltip.tsx'
import { buildElementChanges } from './changesetElements.ts'
import { mapControlButtonClassName } from './map_options.tsx'
import { changeKey, tagGroupsOf } from './tagGroups.ts'

const TOOLTIP = {
  ready:
    'Load the OSM objects around the changes in this view. Uses the public Postpass service. The map stays where it is.',
  more: `Load more OSM objects around the changes in this view, ${MAX_BOXES_PER_CLICK} areas per click. Uses the public Postpass service.`,
  loading: 'Loading the OSM objects around the changes…',
  done: 'Nothing new to load here. Move to other changes to load their surroundings.',
}

/**
 * Lights up while there is something to load: changes in view without their surroundings. A click
 * loads those; the view stays. Nothing here loads by itself.
 */
export function SurroundingsButton({
  viewer,
  workAreas,
  selectedKey,
}: {
  viewer: ChangesetAdiffViewer
  workAreas: WorkArea[]
  selectedKey: string | null
}) {
  const { mainMap } = useMap()
  const mapLoaded = useMapLoaded()
  const view = useMapView(mapLoaded ? mainMap?.getMap() : undefined)
  const loaded = useSurroundingsBoxes()
  const { load, loading } = useLoadSurroundings()
  const groupCursorKey = useGroupCursorKey()

  const changes = buildElementChanges(viewer.adiff.actions)
  const byElement = useMemo(
    () =>
      pointsByElement(
        changesetFeatureIndex(viewer.geojson),
        changes.filter((change) => change.minorMove == null).map(changeKey),
      ),
    [viewer.geojson, changes],
  )

  const focusKey = groupCursorKey ?? selectedKey
  const focusGroup = focusKey ? tagGroupsOf(changes, workAreas).groupByMember.get(focusKey) : null
  const focusKeys = focusGroup?.memberKeys ?? (focusKey ? [focusKey] : [])

  const missing = view
    ? boxesFor(
        missingPoints({
          byElement,
          focusKeys,
          view,
          loaded: Object.values(loaded).filter(
            (box) => view.at - box.loadedAt < SURROUNDINGS_MAX_AGE_MS,
          ),
        }),
        MAX_BOXES_PER_CLICK + 1,
      )
    : []
  const wantsClick = missing.length > 0 && !loading

  function tooltip() {
    if (loading) return TOOLTIP.loading
    if (missing.length > MAX_BOXES_PER_CLICK) return TOOLTIP.more
    return wantsClick ? TOOLTIP.ready : TOOLTIP.done
  }

  return (
    <Tooltip as="span" content={tooltip()} placement="bottom-right" className="inline-flex">
      <button
        type="button"
        aria-label={wantsClick ? 'Load surroundings' : 'Surroundings'}
        aria-disabled={!wantsClick}
        onClick={() => {
          if (wantsClick) load(missing.slice(0, MAX_BOXES_PER_CLICK))
        }}
        className={clsx(mapControlButtonClassName, 'relative', !wantsClick && 'cursor-default')}
      >
        {loading ? (
          <LoaderCircleIcon className="size-5 animate-spin text-zinc-700" />
        ) : (
          <SurroundingsIcon
            className={clsx('size-5', wantsClick ? 'text-emerald-600' : 'text-zinc-300')}
          />
        )}
        {wantsClick ? (
          <span
            aria-hidden
            className="absolute top-1.5 right-1.5 size-2 rounded-full bg-emerald-500 ring-2 ring-white"
          />
        ) : null}
      </button>
    </Tooltip>
  )
}
