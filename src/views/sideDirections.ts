/**
 * Lanes and paths mapped on a road's centre line (`cycleway:right:oneway=yes`,
 * `sidewalk:left:oneway=-1`, …) as helper lines beside it, each with the direction its oneway tag
 * gives: along the way, against it, or both (`no`, drawn without arrows).
 */

export type SideKind = 'cycleway' | 'sidewalk'
type Side = 'left' | 'right'
/** 1: along the way. -1: against it. 0: both directions. */
type Direction = 1 | -1 | 0

export type SideDirection = { kind: SideKind; side: Side; direction: Direction }

const KINDS: SideKind[] = ['cycleway', 'sidewalk']
const SIDES: Side[] = ['left', 'right']

/** Distance from the centre line in px, past the 9 px of the selection halo. */
export const SIDE_OFFSET_PX: Record<SideKind, number> = { cycleway: 13, sidewalk: 20 }

function directionOf(value: string | undefined): Direction | undefined {
  if (value === 'yes' || value === 'true' || value === '1') return 1
  if (value === '-1' || value === 'reverse') return -1
  if (value === 'no' || value === 'false' || value === '0') return 0
  return undefined
}

/** The side-specific tag wins over `…:both:oneway`. */
export function sideDirectionsOf(tags: Record<string, string> | undefined): SideDirection[] {
  if (!tags) return []
  return KINDS.flatMap((kind) =>
    SIDES.flatMap((side) => {
      const direction = directionOf(tags[`${kind}:${side}:oneway`] ?? tags[`${kind}:both:oneway`])
      return direction == null ? [] : [{ kind, side, direction }]
    }),
  )
}

type Position = [number, number]

export type SideLineFeature = {
  type: 'Feature'
  properties: { kind: SideKind; arrows: boolean; offset: number }
  geometry: { type: 'LineString'; coordinates: Position[] }
}

/**
 * One helper line per side direction. A line against the way runs reversed, so its arrows point
 * the right way; its offset sign flips with it (positive is right of the line's own direction).
 */
export function sideLineFeatures(
  coordinates: Position[],
  tags: Record<string, string> | undefined,
): SideLineFeature[] {
  if (coordinates.length < 2) return []
  return sideDirectionsOf(tags).map(({ kind, side, direction }) => {
    const reversed = direction === -1
    const rightOfLine = (side === 'right') !== reversed
    return {
      type: 'Feature',
      properties: {
        kind,
        arrows: direction !== 0,
        offset: (rightOfLine ? 1 : -1) * SIDE_OFFSET_PX[kind],
      },
      geometry: {
        type: 'LineString',
        coordinates: reversed ? [...coordinates].reverse() : coordinates,
      },
    }
  })
}
