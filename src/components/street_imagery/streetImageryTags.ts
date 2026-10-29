/**
 * Which tags hold street-level photos, and which photo ids their values name. Pure: nothing is
 * requested here, and the photo viewer libraries only load once a photo is opened.
 *
 * TODO: replace this with the package's own helpers once `@osm-editor-kit/street-imagery` ships
 * them (`streetImageryTagProvider` / `parseStreetImageryTagValue`). The package has
 * `mapillaryImagesOfTags` today, but it knows Mapillary only and a fixed key grammar.
 */

export type StreetImageryProvider = 'mapillary' | 'panoramax'

export type StreetImageryRef = { provider: StreetImageryProvider; id: string }

export const STREET_IMAGERY_PROVIDER_LABEL: Record<StreetImageryProvider, string> = {
  mapillary: 'Mapillary',
  panoramax: 'Panoramax',
}

/** `mapillary:map_feature` names a detected sign or object, not a photo. */
const NOT_A_PHOTO_SEGMENTS = new Set(['map_feature'])

const MAPILLARY_ID = /^\d{5,30}$/
const PANORAMAX_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const UUID_IN_PATH =
  /\/(?:pictures|items)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i

/**
 * The provider whose photos a key holds, or `undefined`. Any key with `mapillary` or `panoramax`
 * as a colon-separated part counts: `mapillary`, `mapillary:1`, `panoramax:2`, `image:mapillary`,
 * `cycleway:left:mapillary`, `source:traffic_sign:mapillary`.
 */
export function streetImageryProviderOfKey(key: string): StreetImageryProvider | undefined {
  const parts = key.split(':')
  if (parts.some((part) => NOT_A_PHOTO_SEGMENTS.has(part))) return undefined
  if (parts.includes('mapillary')) return 'mapillary'
  if (parts.includes('panoramax')) return 'panoramax'
  return undefined
}

function paramOf(url: URL, name: string) {
  const fromHash = new URLSearchParams(url.hash.replace(/^#/, '')).get(name)
  return url.searchParams.get(name) ?? fromHash ?? undefined
}

function idOfLink(provider: StreetImageryProvider, link: string) {
  let url: URL
  try {
    url = new URL(link)
  } catch {
    return undefined
  }
  if (provider === 'mapillary') {
    if (!/(^|\.)mapillary\.com$/i.test(url.hostname)) return undefined
    return paramOf(url, 'pKey') ?? /\/(?:map\/im|photo)\/(\d+)/.exec(url.pathname)?.[1]
  }
  // Panoramax is federated: any server can host the picture, so the host is not checked.
  return paramOf(url, 'pic') ?? UUID_IN_PATH.exec(url.pathname)?.[1]
}

function normalizedId(provider: StreetImageryProvider, candidate: string | undefined) {
  if (candidate == null) return undefined
  if (provider === 'mapillary') return MAPILLARY_ID.test(candidate) ? candidate : undefined
  return PANORAMAX_ID.test(candidate) ? candidate.toLowerCase() : undefined
}

/**
 * The photo ids in a tag value. Values hold one id, several ids separated by `;`, or links to the
 * photo on the provider's site. Parts that are no id are left out; repeated ids count once.
 */
export function streetImageryIdsOfValue(provider: StreetImageryProvider, value: string) {
  const ids: string[] = []
  for (const part of value.split(';')) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const candidate = /^https?:\/\//i.test(trimmed) ? idOfLink(provider, trimmed) : trimmed
    const id = normalizedId(provider, candidate)
    if (id != null && !ids.includes(id)) ids.push(id)
  }
  return ids
}

/** The photos a tag names; empty when the key holds no photos or the value names none. */
export function streetImageryRefsOfTag(key: string, value: string): StreetImageryRef[] {
  const provider = streetImageryProviderOfKey(key)
  if (provider == null) return []
  return streetImageryIdsOfValue(provider, value).map((id) => ({ provider, id }))
}

type PhotoTagRow = {
  kind: 'added' | 'removed' | 'changed' | 'renamed' | 'unchanged'
  key: string
  value?: unknown
  rawValue?: string
  oldValue?: unknown
  newValue?: unknown
  rawOld?: string
  rawNew?: string
}

export type StreetImageryRowPhoto = StreetImageryRef & {
  /** From the value before the change (a removed row, or the old value of a changed row). */
  old: boolean
}

function stringValue(raw: string | undefined, value: unknown) {
  if (raw != null) return raw
  return typeof value === 'string' ? value : undefined
}

/**
 * The photos of a tag row, to show a button for each. The value after the change counts; the old
 * value of a changed row adds the photos that the change dropped, and a removed row shows its old
 * photos. A value that is not plain text names no photo.
 */
export function streetImageryPhotosOfRow(row: PhotoTagRow): StreetImageryRowPhoto[] {
  const provider = streetImageryProviderOfKey(row.key)
  if (provider == null) return []

  const idsOf = (value: string | undefined) =>
    value == null ? [] : streetImageryIdsOfValue(provider, value)

  if (row.kind === 'changed') {
    const current = idsOf(stringValue(row.rawNew, row.newValue))
    const dropped = idsOf(stringValue(row.rawOld, row.oldValue)).filter(
      (id) => !current.includes(id),
    )
    return [
      ...current.map((id) => ({ provider, id, old: false })),
      ...dropped.map((id) => ({ provider, id, old: true })),
    ]
  }
  const old = row.kind === 'removed'
  return idsOf(stringValue(row.rawValue, row.value)).map((id) => ({ provider, id, old }))
}
