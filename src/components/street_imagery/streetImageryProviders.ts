import { registerProviderAdapters } from '@osm-editor-kit/street-imagery'
import { mapillaryAdapter } from '@osm-editor-kit/street-imagery/providers/mapillary'
import { panoramaxAdapter } from '@osm-editor-kit/street-imagery/providers/panoramax'
import { configureStreetImagery } from './streetImageryRuntime.ts'

/** What the photo lists need: the map's layer and the date filter, whichever loads first. */
export function configureStreetImageryLayer() {
  configureStreetImagery()
  registerProviderAdapters([mapillaryAdapter, panoramaxAdapter])
}
