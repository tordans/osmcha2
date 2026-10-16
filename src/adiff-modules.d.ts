// Typings for the two OSMCha augmented-diff packages, which ship plain JavaScript
// without .d.ts files. The shapes cover what the app uses; update them with the packages.

declare module '@osmcha/osm-adiff-parser' {
  import type { ParsedAdiff } from './components/changeset/changesetElements.ts'

  export default function parseAdiff(xml: string): Promise<ParsedAdiff>
}

declare module '@osmcha/maplibre-adiff-viewer' {
  import type { ParsedAdiff } from './components/changeset/changesetElements.ts'

  export type AdiffViewerOptions = {
    showElements?: string[]
    showActions?: string[]
  }

  export class MapLibreAugmentedDiffViewer {
    constructor(adiff: ParsedAdiff, options?: AdiffViewerOptions)
    readonly adiff: ParsedAdiff
    readonly geojson: GeoJSON.FeatureCollection
    readonly options: Record<string, unknown>
    layers(): Array<{ id: string; type?: string; paint?: Record<string, unknown> }>
  }
}
