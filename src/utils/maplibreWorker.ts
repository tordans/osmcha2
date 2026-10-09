import { setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'

// MapLibre 6 ships its worker as a separate module. Vite has to emit it as an
// asset and tell MapLibre where it is, or no vector or GeoJSON data renders.
// Import this file for its side effect wherever a map is mounted.
setWorkerUrl(workerUrl)
