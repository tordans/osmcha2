import { useSyncExternalStore } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { scrollChangesToWorkArea } from '../components/changeset/scrollChildIntoScroller.ts'
import { useMapLoaded } from '../stores/map-loaded-store.ts'
import { flyMapToChangesetBounds } from './changesetCamera.ts'
import type { LngLatBoundsTuple } from './changesetViewBounds.ts'
import { activeWorkArea, type ActiveWorkArea, type WorkArea } from './changesetWorkAreas.ts'

/** Which work area the review map currently shows; follows every camera move. */
export function useActiveWorkArea(areas: readonly WorkArea[]) {
  const { mainMap } = useMap()
  const mapLoaded = useMapLoaded()

  function subscribe(notify: () => void) {
    if (!mainMap) return () => {}
    mainMap.on('moveend', notify)
    return function unsubscribeFromMoveEnd() {
      mainMap.off('moveend', notify)
    }
  }

  function getSnapshot() {
    const none: ActiveWorkArea = null
    if (!mainMap || !mapLoaded || areas.length === 0) return none
    const view = mainMap.getBounds()
    return activeWorkArea(areas, [view.getWest(), view.getSouth(), view.getEast(), view.getNorth()])
  }

  return useSyncExternalStore(subscribe, getSnapshot)
}

/** Fly the review map to one work area and scroll the Changes list to it; `null` shows all areas. */
export function useJumpToWorkArea(areas: readonly WorkArea[]) {
  const { mainMap } = useMap()
  const mapLoaded = useMapLoaded()

  return function jumpToWorkArea(area: WorkArea | null) {
    if (area) scrollChangesToWorkArea(area.id)
    if (!mainMap || !mapLoaded) return
    const bounds = area
      ? area.bounds
      : areas
          .map((item) => item.bounds)
          .reduce<LngLatBoundsTuple | null>(
            (all, next) =>
              all
                ? [
                    Math.min(all[0], next[0]),
                    Math.min(all[1], next[1]),
                    Math.max(all[2], next[2]),
                    Math.max(all[3], next[3]),
                  ]
                : next,
            null,
          )
    if (bounds) flyMapToChangesetBounds(mainMap.getMap(), bounds)
  }
}
