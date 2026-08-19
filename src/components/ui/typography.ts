/**
 * Content type scale for panes, lists, and data tables.
 * Form controls keep Catalyst `text-base` / `sm:text-sm` so iOS does not zoom.
 */
export const typeScale = {
  /** Pane and section titles */
  heading: 'text-base/6 font-semibold text-zinc-950',
  /** Default reading text */
  body: 'text-sm/6 text-zinc-950',
  /** Captions, timestamps, OSM tag tables */
  small: 'text-xs/4',
} as const
