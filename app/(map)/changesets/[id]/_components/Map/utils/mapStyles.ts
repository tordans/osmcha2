export type TMapStyle = keyof typeof mapStyles

export const mapStyles = {
  // https://cloud.maptiler.com/maps/dataviz/
  maptilerDataviz: {
    url: 'https://api.maptiler.com/maps/dataviz/style.json?key=ur6Yh3ULc6QjatOYBgln',
    name: 'Maptiler Dataviz',
  },
  // https://cloud.maptiler.com/maps/satellite/
  maptilerSatellite: {
    url: 'https://api.maptiler.com/maps/satellite/style.json?key=ur6Yh3ULc6QjatOYBgln',
    name: 'Maptiler Satellite',
  },
  // TODO add osm carto
  // TODO add other
} as const
