import type { StyleSpecification } from 'maplibre-gl'
import type { LngLatBoundsTuple } from '../views/changesetViewBounds.ts'

/*
 * Checks that a background answers before the map switches to it. A layer that the browser may not
 * load (no CORS header, gone, behind a key) would leave the map grey with nothing but console errors.
 */

const PROBE_TIMEOUT_MS = 8000
// About the width of the map pane; only picks a zoom near the one the map fits the area at.
const PROBE_VIEW_PX = 800
const PROBE_MAX_ZOOM = 19

type ProbeSource = {
  tiles: string[]
  tileSize: number
  scheme?: 'xyz' | 'tms'
  minzoom?: number
  maxzoom?: number
}

function rasterSourceOf(style: StyleSpecification): ProbeSource | null {
  for (const source of Object.values(style.sources)) {
    if (source.type === 'raster' && source.tiles && source.tiles.length > 0) {
      return {
        tiles: source.tiles,
        tileSize: source.tileSize ?? 512,
        scheme: source.scheme,
        minzoom: source.minzoom,
        maxzoom: source.maxzoom,
      }
    }
  }
  return null
}

function tileQuadkey(x: number, y: number, z: number) {
  let key = ''
  for (let i = z; i > 0; i--) {
    const mask = 1 << (i - 1)
    key += String((x & mask ? 1 : 0) + (y & mask ? 2 : 0))
  }
  return key
}

function tileBbox3857(x: number, y: number, z: number) {
  const size = (2 * Math.PI * 6378137) / 2 ** z
  const origin = Math.PI * 6378137
  const minX = x * size - origin
  const maxY = origin - y * size
  return [minX, maxY - size, minX + size, maxY].join(',')
}

/** Fills a MapLibre tile URL template (`{z}/{x}/{y}`, `{-y}`, `{quadkey}`, `{bbox-epsg-3857}`). */
export function tileUrl(
  template: string,
  x: number,
  y: number,
  z: number,
  scheme: 'xyz' | 'tms' = 'xyz',
): string {
  const tmsY = 2 ** z - 1 - y
  return template
    .replace(/\{switch:([^}]*)\}/g, (_, options: string) => options.split(',')[0] ?? '')
    .replace(/\{(z|zoom)\}/g, String(z))
    .replace(/\{x\}/g, String(x))
    .replace(/\{y\}/g, String(scheme === 'tms' ? tmsY : y))
    .replace(/\{-y\}/g, String(tmsY))
    .replace(/\{quadkey\}/g, tileQuadkey(x, y, z))
    .replace(/\{bbox-epsg-3857\}/g, tileBbox3857(x, y, z))
    .replace(/\{ratio\}/g, '')
    .replace(/\{prefix\}/g, `${(x % 16).toString(16)}${(y % 16).toString(16)}`)
}

/** The tile in the middle of `bounds`, near the zoom the map fits the bounds at. */
export function probeTile(
  bounds: LngLatBoundsTuple,
  source: Pick<ProbeSource, 'minzoom' | 'maxzoom'>,
) {
  const [west, south, east, north] = bounds
  const lng = (west + east) / 2
  const lat = (south + north) / 2
  const span = Math.max(east - west, 1e-6)
  const fitZoom = Math.floor(Math.log2((360 * PROBE_VIEW_PX) / 256 / span))
  const maxzoom = Math.min(source.maxzoom ?? PROBE_MAX_ZOOM, PROBE_MAX_ZOOM)
  const z = Math.max(source.minzoom ?? 0, Math.min(fitZoom, maxzoom))
  const n = 2 ** z
  const latRad = (lat * Math.PI) / 180
  const x = Math.min(n - 1, Math.max(0, Math.floor(((lng + 180) / 360) * n)))
  const y = Math.min(
    n - 1,
    Math.max(
      0,
      Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n),
    ),
  )
  return { x, y, z }
}

/**
 * True when one tile of the style's raster source in the middle of `bounds` loads as an image, the way
 * MapLibre loads it (a CORS fetch). False on a network or CORS error, a non-image answer, or a timeout.
 */
export async function probeBasemap(
  style: StyleSpecification,
  bounds: LngLatBoundsTuple,
  signal?: AbortSignal,
): Promise<boolean> {
  const source = rasterSourceOf(style)
  if (!source) return true
  const { x, y, z } = probeTile(bounds, source)
  const url = tileUrl(source.tiles[0]!, x, y, z, source.scheme)

  const timeout = AbortSignal.timeout(PROBE_TIMEOUT_MS)
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout
  try {
    const response = await fetch(url, { mode: 'cors', credentials: 'omit', signal: combined })
    if (!response.ok) return false
    const blob = await response.blob()
    if (blob.size === 0) return false
    const bitmap = await createImageBitmap(blob)
    bitmap.close()
    return true
  } catch {
    return false
  }
}
