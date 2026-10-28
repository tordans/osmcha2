/**
 * Which tag rows hold traffic signs, and which value to read the signs from. Pure: the sign catalogue
 * (`@osm-traffic-signs/converter`) is only loaded once a row matches, see `resolveTrafficSigns.ts`.
 */

/** `traffic_sign`, `traffic_sign:forward`, `traffic_sign:2`, `parking:left:traffic_sign`, `maxspeed:traffic_sign` … */
export function isTrafficSignKey(key: string) {
  return key.split(':').includes('traffic_sign')
}

type TrafficSignRow = {
  kind: 'added' | 'removed' | 'changed' | 'renamed' | 'unchanged'
  key: string
  value?: unknown
  rawValue?: string
  oldValue?: unknown
  newValue?: unknown
  rawOld?: string
  rawNew?: string
}

function stringValue(raw: string | undefined, value: unknown) {
  if (raw != null) return raw
  return typeof value === 'string' ? value : undefined
}

/**
 * The value to show signs for: the new value of a changed row, the old value of a removed row, else
 * the value itself. `undefined` when the key is no traffic sign key or the value is no plain text.
 */
export function trafficSignValueOfRow(row: TrafficSignRow) {
  if (!isTrafficSignKey(row.key)) return undefined
  const value =
    row.kind === 'changed'
      ? stringValue(row.rawNew, row.newValue)
      : stringValue(row.rawValue, row.value)
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

/**
 * The country prefix a value starts with (`DE:314,1044-11` → `DE`), upper-cased. With `known` (the
 * converter's `countries`) only a known prefix counts; without it, any two-letter prefix does, which
 * is enough to decide whether loading the converter is worth it.
 */
export function countryPrefixOfValue(value: string, known?: readonly string[]) {
  const match = /^\s*([A-Za-z]{2}):/.exec(value)
  const prefix = match?.[1]?.toUpperCase()
  if (!prefix) return undefined
  if (known && !known.includes(prefix)) return undefined
  return prefix
}
