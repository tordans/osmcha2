import { TOsmChaRealChangeset } from '@app/(map)/_components/Changeset/zod/OsmChaRealChangeset.zod'
import maplibregl from 'maplibre-gl'

export const getChangesetBounds = (bbox: TOsmChaRealChangeset['metadata']['bbox']) => {
  return new maplibregl.LngLatBounds(
    new maplibregl.LngLat(Number(bbox.left), Number(bbox.bottom)),
    new maplibregl.LngLat(Number(bbox.right), Number(bbox.top)),
  )
}
