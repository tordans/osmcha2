import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { act } from 'react'
import { MapProvider } from 'react-map-gl/maplibre'
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest'
import { getStreetImageryViewerActions } from '../../stores/street-imagery-viewer-store.ts'
import { StreetImageryDialog } from './StreetImageryDialog.tsx'

// The viewer needs WebGL; the dialog around it is what is tested here.
vi.mock('@osm-editor-kit/street-imagery-react', () => ({
  StreetLevelImageryViewer: ({ photo }: { photo: { photoId: string } }) => (
    <div data-testid="viewer">{photo.photoId}</div>
  ),
}))

// Its entry also exports the viewer panels, which import the CSS of mapillary-js.
vi.mock('@osm-editor-kit/street-imagery-react/viewer-panels', () => ({
  panoramaxPhotoFromItem: (item: {
    id: string
    geometry: { coordinates: [number, number] }
    properties: { datetime: string; 'geovisio:producer': string }
  }) => ({
    providerId: 'panoramax',
    photoId: item.id,
    sequenceId: null,
    capturedAt: Date.parse(item.properties.datetime),
    isPano: true,
    heading: null,
    lngLat: item.geometry.coordinates,
    creatorName: item.properties['geovisio:producer'],
  }),
}))

const PANORAMAX_ID = '3f1c2d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f'

const panoramaxItem = {
  id: PANORAMAX_ID,
  geometry: { type: 'Point', coordinates: [13.4, 52.5] },
  properties: {
    datetime: '2025-06-01T10:00:00Z',
    'geovisio:producer': 'Kartierer',
    'pers:interior_orientation': { field_of_view: 360 },
  },
}

function renderDialog() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MapProvider>
        <StreetImageryDialog />
      </MapProvider>
    </QueryClientProvider>,
  )
}

// The dialog loads its content lazily; the first transform of it can take longer than a lookup waits.
beforeAll(async () => {
  await import('./StreetImageryDialogContent.tsx')
})

afterEach(() => {
  act(() => getStreetImageryViewerActions().close())
  vi.unstubAllGlobals()
})

describe('StreetImageryDialog', () => {
  test('renders nothing and requests nothing until a photo is opened', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { container } = renderDialog()
    expect(container.innerHTML).toBe('')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('shows a Panoramax photo with its creator and a link to the provider', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ features: [panoramaxItem] }))
    vi.stubGlobal('fetch', fetchMock)
    renderDialog()
    act(() =>
      getStreetImageryViewerActions().openPhoto({ provider: 'panoramax', id: PANORAMAX_ID }),
    )

    expect(await screen.findByTestId('viewer')).toBeTruthy()
    expect(screen.getByText('Panoramax photo')).toBeTruthy()
    expect(screen.getByText('by Kartierer')).toBeTruthy()
    expect(screen.getByRole('link', { name: /Open on Panoramax/ }).getAttribute('href')).toContain(
      `#pic=${PANORAMAX_ID}`,
    )
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`/api/search?ids=${PANORAMAX_ID}`),
      expect.anything(),
    )
  })

  test('says so when the provider has no photo for the id, without a retry button', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ features: [] })))
    renderDialog()
    act(() =>
      getStreetImageryViewerActions().openPhoto({ provider: 'panoramax', id: PANORAMAX_ID }),
    )

    expect(await screen.findByText(/Panoramax has no photo for this id/)).toBeTruthy()
    expect(screen.queryByTestId('viewer')).toBeNull()
    expect(screen.queryByRole('button', { name: /Try again/ })).toBeNull()
    // The link to the provider still works for a photo that did not load.
    expect(screen.getByRole('link', { name: /Open on Panoramax/ })).toBeTruthy()
  })

  test('offers a retry after a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    renderDialog()
    act(() =>
      getStreetImageryViewerActions().openPhoto({ provider: 'panoramax', id: PANORAMAX_ID }),
    )

    expect(await screen.findByRole('button', { name: /Try again/ })).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toContain('could not be loaded')
  })
})
