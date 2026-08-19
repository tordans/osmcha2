import {
  eliSourceId,
  getLayerHydrated,
  getRasterLayerSpec,
  getRasterSourceSpec,
  type EliLayer,
} from '@osm-editor-kit/maplibre-editor-layer-index'
import type * as maplibre from 'maplibre-gl'

const BING_AERIAL_IMAGERY_STYLE: maplibre.StyleSpecification = {
  version: 8,
  sources: {
    bing: {
      type: 'raster',
      scheme: 'xyz',
      tiles: [
        'https://ecn.t0.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z',
        'https://ecn.t1.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z',
        'https://ecn.t2.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z',
        'https://ecn.t3.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z',
      ],
      tileSize: 256,
      maxzoom: 20,
      attribution: 'Imagery © Microsoft Corporation',
    },
  },
  layers: [
    {
      id: 'imagery',
      type: 'raster',
      source: 'bing',
    },
  ],
}

const ESRI_WORLD_IMAGERY_STYLE: maplibre.StyleSpecification = {
  version: 8,
  sources: {
    esri: {
      type: 'raster',
      scheme: 'xyz',
      tiles: [
        'https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?blankTile=false',
        'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?blankTile=false',
      ],
      tileSize: 256,
      maxzoom: 20,
      attribution: 'Imagery © Esri',
    },
  },
  layers: [
    {
      id: 'imagery',
      type: 'raster',
      source: 'esri',
    },
  ],
}

const ESRI_WORLD_IMAGERY_CLARITY_STYLE: maplibre.StyleSpecification = {
  version: 8,
  sources: {
    esri: {
      type: 'raster',
      scheme: 'xyz',
      tiles: [
        'https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?blankTile=false',
      ],
      tileSize: 256,
      maxzoom: 20,
      attribution: 'Imagery © Esri',
    },
  },
  layers: [
    {
      id: 'imagery',
      type: 'raster',
      source: 'esri',
    },
  ],
}

const OPENSTREETMAP_CARTO_STYLE: maplibre.StyleSpecification = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
}

export const BUILTIN_BASEMAP_OPTIONS = [
  {
    id: 'bing',
    label: 'Bing Maps Aerial',
    aliases: ['bing', 'bing maps aerial', 'bing aerial', 'bing maps'],
  },
  {
    id: 'esri',
    label: 'Esri World Imagery',
    aliases: ['esri', 'esri world imagery', 'esriworldimagery'],
  },
  {
    id: 'esri-clarity',
    label: 'Esri World Imagery (Clarity) Beta',
    aliases: [
      'esri world imagery (clarity)',
      'esri world imagery (clarity) beta',
      'esri clarity',
      'esriworldimageryclarity',
    ],
  },
  {
    id: 'carto',
    label: 'OpenStreetMap Carto',
    aliases: ['openstreetmap carto', 'openstreetmap', 'osm carto', 'standard', 'mapnik', 'carto'],
  },
] as const

export type BuiltinBasemapId = (typeof BUILTIN_BASEMAP_OPTIONS)[number]['id']

export const BASEMAP_STYLES: Record<BuiltinBasemapId, maplibre.StyleSpecification> = {
  bing: BING_AERIAL_IMAGERY_STYLE,
  esri: ESRI_WORLD_IMAGERY_STYLE,
  'esri-clarity': ESRI_WORLD_IMAGERY_CLARITY_STYLE,
  carto: OPENSTREETMAP_CARTO_STYLE,
}

export const DEFAULT_BASEMAP_STYLE = BING_AERIAL_IMAGERY_STYLE
export const DEFAULT_BASEMAP_ID: BuiltinBasemapId = 'bing'

const ELI_STYLE_PREFIX = 'eli:'

export function isBuiltinBasemapId(styleId: string): styleId is BuiltinBasemapId {
  return styleId in BASEMAP_STYLES
}

export function toEliStyleId(layerId: string): string {
  return `${ELI_STYLE_PREFIX}${layerId}`
}

export function parseEliStyleId(styleId: string): string | null {
  return styleId.startsWith(ELI_STYLE_PREFIX) ? styleId.slice(ELI_STYLE_PREFIX.length) : null
}

export function styleFromEliLayer(layer: EliLayer): maplibre.StyleSpecification {
  const sourceId = eliSourceId(layer)
  return {
    version: 8,
    sources: {
      [sourceId]: getRasterSourceSpec(layer),
    },
    layers: [
      getRasterLayerSpec(layer, { id: 'imagery', source: sourceId }),
    ] as maplibre.StyleSpecification['layers'],
  }
}

export async function resolveBasemapStyle(styleId: string): Promise<maplibre.StyleSpecification> {
  if (isBuiltinBasemapId(styleId)) {
    return BASEMAP_STYLES[styleId]
  }

  const eliId = parseEliStyleId(styleId)
  if (!eliId) {
    return DEFAULT_BASEMAP_STYLE
  }

  const layer = await getLayerHydrated(eliId)
  if (!layer) {
    return DEFAULT_BASEMAP_STYLE
  }

  return styleFromEliLayer(layer)
}
