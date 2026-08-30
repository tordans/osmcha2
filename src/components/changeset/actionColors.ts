import { PencilIcon, PlusCircleIcon, TrashIcon } from '../ui/icons.ts'

export type ElementActionKey = 'create' | 'modify' | 'delete'

/**
 * Single source for create/modify/delete/noop: Catalyst badge token, map paint hex
 * (Tailwind 400), icon, labels, tag text/checkbox tints matching Badge fills.
 */
export const ACTION = {
  create: {
    token: 'teal',
    hex: '#2dd4bf',
    icon: PlusCircleIcon,
    label: 'Created',
    filterLabel: 'Added',
    tagText: 'text-teal-700',
    checkbox:
      '[--checkbox-check:var(--color-teal-700)] [--checkbox-checked-bg:var(--color-teal-500)]/15 [--checkbox-checked-border:var(--color-teal-500)]/15',
  },
  modify: {
    token: 'yellow',
    hex: '#facc15',
    icon: PencilIcon,
    label: 'Modified',
    filterLabel: 'Modified',
    tagText: 'text-yellow-800',
    checkbox:
      '[--checkbox-check:var(--color-yellow-800)] [--checkbox-checked-bg:var(--color-yellow-400)]/20 [--checkbox-checked-border:var(--color-yellow-400)]/20',
  },
  delete: {
    token: 'red',
    hex: '#f87171',
    icon: TrashIcon,
    label: 'Deleted',
    filterLabel: 'Deleted',
    tagText: 'text-red-700',
    checkbox:
      '[--checkbox-check:var(--color-red-700)] [--checkbox-checked-bg:var(--color-red-500)]/15 [--checkbox-checked-border:var(--color-red-500)]/15',
  },
  noop: {
    token: 'violet',
    hex: '#a78bfa',
    icon: null,
    label: 'Unchanged',
    filterLabel: 'Unchanged',
    tagText: 'text-zinc-500',
    checkbox:
      '[--checkbox-check:var(--color-violet-700)] [--checkbox-checked-bg:var(--color-violet-500)]/15 [--checkbox-checked-border:var(--color-violet-500)]/15',
    /** Matches `hex` (Tailwind violet-400) for legend dots. */
    swatchClass: 'bg-violet-400',
  },
} as const

export const ACTION_UI_COLOR = {
  create: ACTION.create.token,
  modify: ACTION.modify.token,
  delete: ACTION.delete.token,
  noop: ACTION.noop.token,
} as const

/** Hardcoded `@osmcha/maplibre-adiff-viewer` paint → registry hex. */
const ADIFF_VIEWER_HEX: Record<string, string> = {
  '#4ECDC4': ACTION.create.hex,
  '#FFE66D': ACTION.modify.hex,
  '#FF6B6B': ACTION.delete.hex,
  '#8B79C4': ACTION.noop.hex,
}

export function remapAdiffActionPaint(value: unknown): unknown {
  if (typeof value === 'string') return ADIFF_VIEWER_HEX[value] ?? value
  if (Array.isArray(value)) return value.map(remapAdiffActionPaint)
  return value
}

export function remapAdiffActionLayers<T extends { paint?: Record<string, unknown> }>(
  layers: T[],
): T[] {
  return layers.map((layer) => {
    if (!layer.paint) return layer
    const paint: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(layer.paint)) {
      paint[key] = remapAdiffActionPaint(value)
    }
    return { ...layer, paint }
  })
}
