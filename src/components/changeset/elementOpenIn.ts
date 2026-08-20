/** Open-in URLs for a single OSM element. */

export function elementPath(type: string, id: number | string): string {
  return `${type}/${id}`
}

export function idToMinimalForm(id: string): string {
  const [type, num] = id.split('/')
  return `${type[0]}${num}`
}

export function elementOpenInUrls(id: string, lat?: number, lng?: number) {
  const urls: {
    osm: string
    id: string
    josm: string
    level0: string
    rapid: string
    history: string
    deepHistory: string
    pewu: string
    mapillary?: string
    panoramax?: string
  } = {
    osm: `https://www.openstreetmap.org/${id}`,
    id: `https://www.openstreetmap.org/edit?editor=id&${id.replace('/', '=')}`,
    josm: `http://127.0.0.1:8111/load_object?new_layer=true&objects=${idToMinimalForm(id)}`,
    level0: `http://level0.osmz.ru/?url=${id}`,
    rapid: `https://rapideditor.org/edit#id=${idToMinimalForm(id)}`,
    history: `https://www.openstreetmap.org/${id}/history`,
    deepHistory: `https://osmlab.github.io/osm-deep-history/#/${id}`,
    pewu: `https://pewu.github.io/osm-history/#/${id}`,
  }

  if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
    urls.mapillary = `https://www.mapillary.com/app/?lat=${lat}&lng=${lng}&z=16`
    urls.panoramax = `https://api.panoramax.xyz/?focus=map&map=16/${lat}/${lng}`
  }

  return urls
}

export function elementCoord(
  action: { old?: Record<string, any>; new?: Record<string, any> },
  key: 'lat' | 'lon',
): number | undefined {
  const value =
    action.new?.[key] ||
    action.new?.nodes?.at(0)?.[key] ||
    action.old?.nodes?.at(0)?.[key] ||
    action.new?.members?.at(0)?.[key] ||
    action.new?.members?.at(0)?.nodes?.at(0)?.[key] ||
    action.old?.members?.at(0)?.[key] ||
    action.old?.members?.at(0)?.nodes?.at(0)?.[key]
  return typeof value === 'number' ? value : undefined
}
