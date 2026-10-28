import { afterEach, describe, expect, test, vi } from 'vitest'
import { fetchOsmNote, OsmNoteUnavailableError, osmNoteSchema } from './osmNotes.ts'

// Shaped like https://api.openstreetmap.org/api/0.6/notes/<id>.json
const closedNote = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [13.4050123, 52.5200456] },
  properties: {
    id: 5296798,
    url: 'https://api.openstreetmap.org/api/0.6/notes/5296798.json',
    reopen_url: 'https://api.openstreetmap.org/api/0.6/notes/5296798/reopen.json',
    date_created: '2026-03-02 09:14:55 UTC',
    closed_at: '2026-03-04 17:02:11 UTC',
    status: 'closed',
    comments: [
      {
        date: '2026-03-02 09:14:55 UTC',
        action: 'opened',
        text: 'Hier fehlt ein Weg.\nSiehe https://example.com/foto',
        html: '<p>Hier fehlt ein Weg.<br>Siehe <a href="https://example.com/foto">https://example.com/foto</a></p>',
      },
      {
        date: '2026-03-04 17:02:11 UTC',
        uid: 42,
        user: 'Kartierer',
        user_url: 'https://www.openstreetmap.org/user/Kartierer',
        action: 'closed',
        text: 'Erledigt.',
        html: '<p>Erledigt.</p>',
      },
    ],
  },
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('osmNoteSchema', () => {
  test('reads a closed note with an anonymous opening comment', () => {
    const note = osmNoteSchema.parse(closedNote)
    expect(note).toEqual({
      id: 5296798,
      status: 'closed',
      createdAt: '2026-03-02T09:14:55.000Z',
      closedAt: '2026-03-04T17:02:11.000Z',
      lng: 13.4050123,
      lat: 52.5200456,
      comments: [
        {
          date: '2026-03-02T09:14:55.000Z',
          user: null,
          userUrl: null,
          action: 'opened',
          text: 'Hier fehlt ein Weg.\nSiehe https://example.com/foto',
        },
        {
          date: '2026-03-04T17:02:11.000Z',
          user: 'Kartierer',
          userUrl: 'https://www.openstreetmap.org/user/Kartierer',
          action: 'closed',
          text: 'Erledigt.',
        },
      ],
    })
  })

  test('reads an open note without closed_at', () => {
    const { closed_at: _closedAt, ...properties } = closedNote.properties
    const note = osmNoteSchema.parse({
      ...closedNote,
      properties: { ...properties, status: 'open', comments: properties.comments.slice(0, 1) },
    })
    expect(note.status).toBe('open')
    expect(note.closedAt).toBeNull()
    expect(note.comments).toHaveLength(1)
  })

  test('accepts a hidden note', () => {
    const note = osmNoteSchema.parse({
      ...closedNote,
      properties: { ...closedNote.properties, status: 'hidden' },
    })
    expect(note.status).toBe('hidden')
  })

  test('treats an unknown comment action as a plain comment', () => {
    const note = osmNoteSchema.parse({
      ...closedNote,
      properties: {
        ...closedNote.properties,
        comments: [{ date: '2026-03-02 09:14:55 UTC', action: 'merged', text: 'x' }],
      },
    })
    expect(note.comments[0]?.action).toBe('commented')
  })

  test('rejects an unknown status', () => {
    const result = osmNoteSchema.safeParse({
      ...closedNote,
      properties: { ...closedNote.properties, status: 'archived' },
    })
    expect(result.success).toBe(false)
  })

  test('rejects missing coordinates and unreadable dates', () => {
    expect(osmNoteSchema.safeParse({ ...closedNote, geometry: { type: 'Point' } }).success).toBe(
      false,
    )
    expect(
      osmNoteSchema.safeParse({
        ...closedNote,
        properties: { ...closedNote.properties, date_created: 'yesterday' },
      }).success,
    ).toBe(false)
  })

  test('also reads ISO dates', () => {
    const note = osmNoteSchema.parse({
      ...closedNote,
      properties: { ...closedNote.properties, date_created: '2026-03-02T09:14:55Z' },
    })
    expect(note.createdAt).toBe('2026-03-02T09:14:55.000Z')
  })
})

function stubFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('fetchOsmNote', () => {
  test('requests the public note JSON and parses it', async () => {
    const fetchMock = stubFetch(Response.json(closedNote))
    const note = await fetchOsmNote(5296798)
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://api.openstreetmap.org/api/0.6/notes/5296798.json',
    )
    expect(note.id).toBe(5296798)
  })

  test('maps 404 to a missing note', async () => {
    stubFetch(new Response('', { status: 404 }))
    await expect(fetchOsmNote(1)).rejects.toMatchObject({
      name: 'OsmNoteUnavailableError',
      reason: 'missing',
    })
  })

  test('maps 410 to a hidden note', async () => {
    stubFetch(new Response('', { status: 410 }))
    const error = await fetchOsmNote(1).catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(OsmNoteUnavailableError)
    expect((error as OsmNoteUnavailableError).reason).toBe('hidden')
  })

  test('throws a plain error on other statuses', async () => {
    stubFetch(new Response('', { status: 503 }))
    const error = await fetchOsmNote(1).catch((caught: unknown) => caught)
    expect(error).not.toBeInstanceOf(OsmNoteUnavailableError)
    expect((error as Error).message).toContain('503')
  })

  test('throws when the body is not a note', async () => {
    stubFetch(Response.json({ hello: 'world' }))
    await expect(fetchOsmNote(1)).rejects.toThrow()
  })
})
