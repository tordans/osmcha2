// Basemap ids live outside the components layer so stores can depend on them.

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

export const DEFAULT_BASEMAP_ID: BuiltinBasemapId = 'bing'

// Plain object lookup: `in` keeps the same semantics as the former BASEMAP_STYLES check.
const BUILTIN_BASEMAP_LOOKUP = Object.fromEntries(
  BUILTIN_BASEMAP_OPTIONS.map((option) => [option.id, true]),
)

export function isBuiltinBasemapId(styleId: string): styleId is BuiltinBasemapId {
  return styleId in BUILTIN_BASEMAP_LOOKUP
}
