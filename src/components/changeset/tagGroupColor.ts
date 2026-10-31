/**
 * The one colour of a "Same tag changes" group: its shape and label on the map, and its code in the
 * Changes list. Indigo: not the fuchsia work areas, not the yellow selection, not the sky and amber
 * pins, not the action colors.
 */
export const TAG_GROUP_COLOR = '#4f46e5'
/** A soft fill with a faint edge, on the map and in the list alike: reads apart from drawn lines. */
export const TAG_GROUP_FILL = 'rgba(79, 70, 229, 0.32)'
export const TAG_GROUP_EDGE = 'rgba(79, 70, 229, 0.5)'
/** The code on the map and in the list: the group's colour with a thin white edge (half the stroke shows). */
export const TAG_GROUP_CODE_STYLE = {
  color: TAG_GROUP_COLOR,
  WebkitTextStroke: '2px white',
  paintOrder: 'stroke fill',
} as const
