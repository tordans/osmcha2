import adiffParser from '@osmcha/osm-adiff-parser'
import { subSeconds } from 'date-fns'
import { adiffServiceUrl, apiOSM, overpassBase } from '../config/constants.ts'
import { parseOsmDate } from '../utils/datetime.ts'
import { osmChangesetPayloadSchema } from './openstreetmap.ts'
import { api } from './request.ts'

export function fetchChangeset(id: number) {
  return api.get(`/changesets/${id}/`)
}

export async function fetchAndParseAugmentedDiff(id: number) {
  const xml = await fetchAugmentedDiff(id)
  const adiff = await adiffParser(xml)
  return adiff
}

/// Fetch an augmented diff for the given changeset ID. Tries to fetch from the
/// configured adiff service (if it exists) and falls back to using the configured
/// Overpass server if that fails. A 404 from the adiff service is expected for
/// very new changesets (generation lags the OSM API).
async function fetchAugmentedDiff(id: number) {
  try {
    return await fetchAugmentedDiffFromAdiffService(id)
  } catch (err) {
    if (err instanceof AdiffServiceMissError) {
      console.warn(err.message)
    } else {
      console.error(err)
    }
    return await fetchAugmentedDiffFromOverpass(id)
  }
}

class AdiffServiceMissError extends Error {
  constructor(id: number, status: number, statusText: string) {
    super(`GET /changesets/${id}.adiff returned ${status} ${statusText}`.trim())
    this.name = 'AdiffServiceMissError'
  }
}

async function fetchAugmentedDiffFromAdiffService(id: number) {
  const res = await fetch(`${adiffServiceUrl}/changesets/${id}.adiff`)
  if (res.status === 404) {
    throw new AdiffServiceMissError(id, res.status, res.statusText)
  }
  if (res.status !== 200) {
    throw new Error(`GET /changesets/${id}.adiff returned ${res.status} ${res.statusText}`.trim())
  }
  return await res.text()
}

async function fetchAugmentedDiffFromOverpass(id: number) {
  let res = await fetch(`${apiOSM}/changeset/${id}.json`)
  if (!res.ok) {
    throw new Error(`OpenStreetMap changeset ${id} returned ${res.status} ${res.statusText}`.trim())
  }
  const parsed = osmChangesetPayloadSchema.safeParse(await res.json())
  if (!parsed.success) {
    throw new Error(`OpenStreetMap changeset ${id} returned invalid JSON`)
  }
  const { changeset } = parsed.data
  if (!changeset.created_at) {
    throw new Error(`OpenStreetMap changeset ${id} is missing created_at`)
  }
  const createdAt = parseOsmDate(changeset.created_at)
  const adiffDates: Date[] = [subSeconds(createdAt, 1)]
  if (changeset.closed_at) {
    adiffDates.push(parseOsmDate(changeset.closed_at))
  }

  const adiffArgs = adiffDates.map((d) => `"${d.toISOString()}"`).join(',')

  let data = `[out:xml][adiff:${adiffArgs}];`
  data += '(node(bbox)(changed);way(bbox)(changed);relation(bbox)(changed););out meta geom(bbox);'

  const epsilon = 0.00001
  const bbox = [
    changeset.min_lon! - epsilon || -180,
    changeset.min_lat! - epsilon || -90,
    changeset.max_lon! + epsilon || 180,
    changeset.max_lat! + epsilon || 90,
  ]

  res = await fetch(`${overpassBase}?data=${encodeURIComponent(data)}&bbox=${bbox.join(',')}`)
  if (!res.ok) {
    throw new Error(
      `Overpass adiff for changeset ${id} returned ${res.status} ${res.statusText}`.trim(),
    )
  }
  return await res.text()
}

/**
 * Mark a changeset as Looks OK (`set-good`), Needs a look (`set-harmful`), or clear.
 * Optional `tags` is sent as `{ tags: number[] }` — use `[]` to clear leftover tags on Looks OK.
 * Keep review model docs in sync: docs/review.md
 */
export function setHarmful(id: number, harmful: boolean | -1, tags?: number[]) {
  // -1 is for unsetting
  const action = harmful === -1 ? 'uncheck' : harmful ? 'set-harmful' : 'set-good'
  const body = tags !== undefined ? { tags } : undefined
  return api.put(`/changesets/${id}/${action}/`, body)
}

export function setTag(id: number, tag: any, remove: boolean = false) {
  if (Number.isNaN(parseInt(tag.value, 10))) {
    throw new Error('tag is not a valid number')
  }

  const endpoint = `/changesets/${id}/tags/${tag.value}/`
  return remove ? api.delete(endpoint) : api.post(endpoint, { tag_pk: tag, id })
}

export function postComment(id: number, comment: string) {
  return api.post(`/changesets/${id}/comment/`, { comment })
}
