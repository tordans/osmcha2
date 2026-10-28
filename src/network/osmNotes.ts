import { z } from 'zod'
import { apiOSM } from '../config/constants.ts'

/** The note API writes `2026-05-07 09:21:03 UTC`; read it as UTC and return ISO 8601. */
function noteDateToIso(value: string, ctx: z.RefinementCtx) {
  const match = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(?:\.\d+)?(?: ?UTC|Z)?$/.exec(
    value.trim(),
  )
  const date = new Date(match ? `${match[1]}T${match[2]}Z` : value)
  if (Number.isNaN(date.getTime())) {
    ctx.addIssue({ code: 'custom', message: `Invalid note date "${value}"` })
    return z.NEVER
  }
  return date.toISOString()
}

const noteDateSchema = z.string().transform(noteDateToIso)

const noteCommentSchema = z.object({
  date: noteDateSchema,
  uid: z.number().optional(),
  /** Missing for anonymous (legacy) comments. */
  user: z.string().optional(),
  user_url: z.string().optional(),
  // A new action must not make the whole note unreadable.
  action: z.enum(['opened', 'commented', 'closed', 'reopened', 'hidden']).catch('commented'),
  text: z.string().default(''),
})

/** `GET /api/0.6/notes/<id>.json`, a GeoJSON feature. Coordinates are `[lon, lat]`. */
const osmNoteResponseSchema = z.object({
  geometry: z.object({
    coordinates: z.tuple([z.number(), z.number()]),
  }),
  properties: z.object({
    id: z.number(),
    status: z.enum(['open', 'closed', 'hidden']),
    date_created: noteDateSchema,
    closed_at: noteDateSchema.optional(),
    comments: z.array(noteCommentSchema),
  }),
})

export const osmNoteSchema = osmNoteResponseSchema.transform(({ geometry, properties }) => ({
  id: properties.id,
  status: properties.status,
  createdAt: properties.date_created,
  closedAt: properties.closed_at ?? null,
  lng: geometry.coordinates[0],
  lat: geometry.coordinates[1],
  comments: properties.comments.map((comment) => ({
    date: comment.date,
    user: comment.user ?? null,
    userUrl: comment.user_url ?? null,
    action: comment.action,
    text: comment.text,
  })),
}))

export type OsmNote = z.output<typeof osmNoteSchema>
export type OsmNoteComment = OsmNote['comments'][number]

/** The note does not exist (404) or was hidden by a moderator (410). Retrying will not help. */
export class OsmNoteUnavailableError extends Error {
  readonly reason: 'missing' | 'hidden'

  constructor(reason: 'missing' | 'hidden') {
    super(
      reason === 'hidden' ? 'This note was hidden by a moderator.' : 'This note does not exist.',
    )
    this.name = 'OsmNoteUnavailableError'
    this.reason = reason
  }
}

/** Public read, no sign-in. */
export async function fetchOsmNote(id: number, signal?: AbortSignal): Promise<OsmNote> {
  const res = await fetch(`${apiOSM}/notes/${id}.json`, { signal })
  if (res.status === 404) throw new OsmNoteUnavailableError('missing')
  if (res.status === 410) throw new OsmNoteUnavailableError('hidden')
  if (!res.ok) throw new Error(`OpenStreetMap answered ${res.status} for note #${id}.`)
  return osmNoteSchema.parse(await res.json())
}
