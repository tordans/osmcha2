import { NOTE_PUBLIC_ORIGIN } from '../../config/constants.ts'
import { serializePinParam, type PinParam } from '../../routing/pinParam.ts'
import { serializeRefParam, type RefParam } from '../../routing/refParam.ts'
import type { AdiffAction } from './changesetElements.ts'

export type { RefParam }

export function actionMatchingRef(
  actions: AdiffAction[],
  ref: RefParam | null,
): AdiffAction | null {
  if (!ref) return null
  return (
    actions.find((action) => {
      const element = action.new ?? action.old
      return element?.type === ref.type && element?.id === ref.id
    }) ?? null
  )
}

/** Set `ref` in search, or omit it. Leaves `pin` and other keys untouched. */
export function searchWithRef<T extends object>(search: T, ref: RefParam | null): T {
  if (!ref) {
    const { ref: _ref, ...rest } = search as T & { ref?: string }
    return rest as T
  }
  return { ...search, ref: serializeRefParam(ref) }
}

/**
 * `searchWithRef`, then pin: `undefined` leaves it, `null` clears it, a value writes it.
 */
export function searchWithRefAndPin<T extends object>(
  search: T,
  ref: RefParam | null,
  pin?: PinParam | null,
): T {
  const withRef = searchWithRef(search, ref)
  if (pin === undefined) return withRef
  if (pin === null) {
    const { pin: _pin, ...rest } = withRef as T & { pin?: string }
    return rest as T
  }
  return { ...withRef, pin: serializePinParam(pin) }
}

export function refParamFromElement(
  type: string | undefined,
  id: number | undefined,
  key?: string,
): RefParam | null {
  if (type !== 'node' && type !== 'way' && type !== 'relation') return null
  if (id == null || !Number.isInteger(id) || id <= 0) return null
  return key ? { type, id, key } : { type, id }
}

/** Stable key for one-shot deep-link apply (tab, sheet, zoom, flash). */
export function refDeepLinkKey(
  changesetId: number,
  ref: RefParam | null,
  pin?: string,
): string | null {
  if (!ref && !pin) return null
  return `${changesetId}:${ref ? serializeRefParam(ref) : ''}:${pin ?? ''}`
}

export function refsEqual(a: RefParam | null | undefined, b: RefParam | null | undefined): boolean {
  if (!a && !b) return true
  if (!a || !b) return false
  return a.type === b.type && a.id === b.id && (a.key ?? '') === (b.key ?? '')
}

/** True when `ref` addresses any object in a same-tag group (tag key ignored). */
export function tagGroupContainsRef(
  changes: Array<{ type: string; id: number }>,
  ref: RefParam | null | undefined,
): boolean {
  if (!ref) return false
  return changes.some((change) => change.type === ref.type && change.id === ref.id)
}

/** Object-level copy URL. Strips a tag key; does not include `pin`. */
export function changesetObjectUrl(changesetId: number, ref: RefParam): string {
  const objectRef = serializeRefParam({ type: ref.type, id: ref.id })
  return `${NOTE_PUBLIC_ORIGIN}/changesets/${changesetId}?ref=${objectRef}`
}
