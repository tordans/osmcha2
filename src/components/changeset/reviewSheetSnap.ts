/** Phone review sheet stops, top to bottom: full list, map and list together, map with a strip. */
export const SHEET_POSITIONS = ['list', 'half', 'map'] as const

export type SheetPosition = (typeof SHEET_POSITIONS)[number]

/** `translateY` of the sheet at each stop, in px; `list` is 0. */
export type SheetOffsets = Record<SheetPosition, number>

/** Release speed (px/s) that counts as a flick and moves one stop that way. */
const FLICK_VELOCITY = 500

/**
 * Offsets for a sheet of `sheetHeight` that leaves `peekHeight` (strip plus safe area)
 * visible in the map position. The half stop shows about half the sheet.
 */
export function sheetOffsets(sheetHeight: number, peekHeight: number) {
  const map = Math.max(0, Math.round(sheetHeight - peekHeight))
  const half = Math.min(map, Math.round(sheetHeight / 2))
  const offsets: SheetOffsets = { list: 0, half, map }
  return offsets
}

/** Where a drag released at `offset` lands: a flick moves one stop from `from`, otherwise the nearest stop wins. */
export function snapSheetPosition({
  offset,
  velocity,
  from,
  offsets,
}: {
  offset: number
  velocity: number
  from: SheetPosition
  offsets: SheetOffsets
}) {
  if (Math.abs(velocity) >= FLICK_VELOCITY) {
    const index = SHEET_POSITIONS.indexOf(from) + (velocity > 0 ? 1 : -1)
    const clamped = Math.min(SHEET_POSITIONS.length - 1, Math.max(0, index))
    return SHEET_POSITIONS[clamped]!
  }
  let nearest: SheetPosition = from
  for (const position of SHEET_POSITIONS) {
    if (Math.abs(offsets[position] - offset) < Math.abs(offsets[nearest] - offset)) {
      nearest = position
    }
  }
  return nearest
}

/**
 * How many px of the map container the sheet covers at `position`, so camera moves can
 * pad the target into the visible part. The map position adds the floating element card.
 */
export function sheetCoveredHeight(
  position: Exclude<SheetPosition, 'list'>,
  {
    sheetHeight,
    offsets,
    cardHeight,
  }: { sheetHeight: number; offsets: SheetOffsets; cardHeight: number },
) {
  const visible = Math.max(0, sheetHeight - offsets[position])
  return position === 'map' ? visible + cardHeight : visible
}
