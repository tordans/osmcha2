import { serializePinParam, type PinParam } from '../routing/pinParam.ts'

export type PinSource = {
  pin: PinParam
  draft?: boolean
  /** Draft note id — keeps the number stable when the pin is dragged. */
  id?: string
}

export type NumberedPin = {
  pin: PinParam
  number: number
  draft?: boolean
  id?: string
}

function pinIdentity(item: PinSource) {
  return item.id ? `draft:${item.id}` : serializePinParam(item.pin)
}

/** View-local pin numbers: first appearance wins. Drafts are keyed by note id. */
export function numberPins(pins: PinSource[]): NumberedPin[] {
  const seen = new Map<string, NumberedPin>()
  const ordered: NumberedPin[] = []
  for (const item of pins) {
    const key = pinIdentity(item)
    const existing = seen.get(key)
    if (existing) {
      existing.pin = item.pin
      if (item.draft) existing.draft = true
      continue
    }
    const numbered: NumberedPin = {
      pin: item.pin,
      number: ordered.length + 1,
      ...(item.draft ? { draft: true } : {}),
      ...(item.id ? { id: item.id } : {}),
    }
    seen.set(key, numbered)
    ordered.push(numbered)
  }
  return ordered
}
