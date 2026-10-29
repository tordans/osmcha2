import { createStreetImageryConfig, setStreetImageryConfig } from '@osm-editor-kit/street-imagery'
import { MAPILLARY_TOKEN } from '../../config/constants.ts'

let configured = false

/**
 * Gives the street-imagery package its Mapillary token. The package reads the configuration when
 * it fetches, so this runs once before the first viewer or layer. Only the lazy chunks that use
 * the package import this, so nothing of the package is in the main bundle.
 */
export function configureStreetImagery() {
  if (configured) return
  configured = true
  setStreetImageryConfig(createStreetImageryConfig({ mapillaryToken: MAPILLARY_TOKEN }))
}
