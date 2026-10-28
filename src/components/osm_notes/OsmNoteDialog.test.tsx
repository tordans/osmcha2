import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { act } from 'react'
import { MapProvider } from 'react-map-gl/maplibre'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { getOsmNoteActions } from '../../stores/osm-note-store.ts'
import { OsmNoteDialog } from './OsmNoteDialog.tsx'

const note = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [13.4, 52.5] },
  properties: {
    id: 77,
    date_created: '2026-03-02 09:14:55 UTC',
    status: 'open',
    comments: [
      {
        date: '2026-03-02 09:14:55 UTC',
        action: 'opened',
        text: '<b>bold</b> see https://example.com/foto',
      },
      {
        date: '2026-03-03 10:00:00 UTC',
        user: 'Kartierer',
        user_url: 'https://www.openstreetmap.org/user/Kartierer',
        action: 'commented',
        text: 'Danke',
      },
    ],
  },
}

function renderDialog() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MapProvider>
        <OsmNoteDialog />
      </MapProvider>
    </QueryClientProvider>,
  )
}

afterEach(() => {
  act(() => getOsmNoteActions().close())
  vi.unstubAllGlobals()
})

describe('OsmNoteDialog', () => {
  test('does not fetch until a note is opened', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    renderDialog()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('shows the note thread as text and links to openstreetmap.org', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(note)))
    renderDialog()
    act(() => getOsmNoteActions().openNote(77))

    expect(await screen.findByText('Open')).toBeTruthy()
    expect(screen.getByText('Note #77')).toBeTruthy()
    // The note text is shown as text, never as HTML.
    expect(screen.getByText(/<b>bold<\/b>/)).toBeTruthy()
    expect(document.querySelector('b')).toBeNull()
    expect(screen.getByRole('link', { name: 'https://example.com/foto' })).toBeTruthy()
    expect(screen.getByText('Anonymous')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Kartierer' }).getAttribute('href')).toBe(
      'https://www.openstreetmap.org/user/Kartierer',
    )
    expect(
      screen.getByRole('link', { name: /Open on openstreetmap.org/ }).getAttribute('href'),
    ).toBe('https://www.openstreetmap.org/note/77')
  })

  test('explains a hidden or missing note without a retry button', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 410 })))
    renderDialog()
    act(() => getOsmNoteActions().openNote(78))

    expect(await screen.findByText('This note was hidden by a moderator.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Try again/ })).toBeNull()
  })

  test('offers a retry after a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    renderDialog()
    act(() => getOsmNoteActions().openNote(79))

    expect(await screen.findByRole('button', { name: /Try again/ })).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toContain('could not be loaded')
  })
})
