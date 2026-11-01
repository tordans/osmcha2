/** The sheet's flick speed in px/s from which the direction decides, not the distance. */
const FLICK_VELOCITY = 400

/** Whether a drag of the photo sheet ends small. `offset` runs from 0 (open) to `miniOffset`. */
export function snapToMini({
  offset,
  velocity,
  miniOffset,
}: {
  offset: number
  velocity: number
  miniOffset: number
}) {
  if (Math.abs(velocity) >= FLICK_VELOCITY) return velocity > 0
  return offset > miniOffset / 2
}
