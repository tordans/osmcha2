import type { CSSProperties } from 'react'

/**
 * Rows of the Changes list skip style, layout and paint while they are off screen
 * (`content-visibility: auto`). A big changeset lists hundreds of rows with thousands of
 * elements; on a phone laying all of them out blocked the first paint for about half a second.
 *
 * Off screen a row takes the height from `containIntrinsicSize`: the estimate below until the row
 * was drawn once, then its real height (`auto`). The estimate only needs to be close; the scroll to
 * a selected row runs again for a few frames and lands on the real position.
 */
export const OFFSCREEN_ROW_CLASSNAME = '[content-visibility:auto]'

/** Px per tag row and for the row header, measured at phone width. */
const TAG_ROW_PX = 21
const ROW_HEADER_PX = 34
const COMPACT_ROW_PX = 32
const GROUP_HEADER_PX = 70
const CLOSED_GROUP_PX = 46
/** The preset line under a title: one `text-xs/4` line (16px) and the row's 2px gap. */
const PRESET_LINE_PX = 18
/** The line that explains an open group. */
const GROUP_EXPLANATION_PX = 32

export function offscreenRowStyle(estimatedPx: number): CSSProperties {
  return { containIntrinsicSize: `auto ${Math.round(estimatedPx)}px` }
}

export function estimatedChangeRowPx({
  compact,
  tagRows,
  extraLines = 0,
  presetLine = false,
}: {
  compact: boolean
  tagRows: number
  extraLines?: number
  presetLine?: boolean
}) {
  if (compact) return COMPACT_ROW_PX
  return (
    ROW_HEADER_PX +
    TAG_ROW_PX * (Math.max(tagRows, 1) + extraLines) +
    (presetLine ? PRESET_LINE_PX : 0)
  )
}

export function estimatedGroupPx({ members, tagRows }: { members: number; tagRows: number }) {
  if (members === 0) return CLOSED_GROUP_PX
  return GROUP_HEADER_PX + GROUP_EXPLANATION_PX + COMPACT_ROW_PX * members + TAG_ROW_PX * tagRows
}
