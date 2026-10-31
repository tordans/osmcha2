export const SURROUNDINGS_SOURCE_ID = 'surroundings'
export const SURROUNDINGS_LINE_HIT_LAYER_ID = 'surroundings-lines-hit'
export const SURROUNDINGS_NODE_HIT_LAYER_ID = 'surroundings-nodes-hit'
/** Transparent hit targets used for hover; the thin paint layers stay out of picking. */
export const SURROUNDINGS_LAYER_IDS: string[] = [
  SURROUNDINGS_LINE_HIT_LAYER_ID,
  SURROUNDINGS_NODE_HIT_LAYER_ID,
]
