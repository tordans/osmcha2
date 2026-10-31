import { use } from 'react'
import { Layer, Marker, Source } from 'react-map-gl/maplibre'
import {
  TAG_GROUP_CODE_STYLE,
  TAG_GROUP_EDGE,
  TAG_GROUP_FILL,
} from '../components/changeset/tagGroupColor.ts'
import type { TagGroup } from '../components/changeset/tagGroups.ts'
import type { ChangesetAdiffViewer } from './changesetAdiffViewer.ts'
import { groupOutlineOnce } from './tagGroupOutlineGeo.ts'

const OUTLINE_SOURCE_ID = 'changeset-tag-group-outline'

/**
 * The rubber band around the members of the selected "Same tag changes" group, with its code. Each
 * group has one shape, computed once, that only scales with the map; it suspends until that is done.
 * Loaded on demand: the Bubble Sets library comes with this file.
 */
export default function TagGroupOutline({
  viewer,
  group,
  beforeId,
}: {
  viewer: ChangesetAdiffViewer
  group: TagGroup
  beforeId?: string
}) {
  const outline = use(groupOutlineOnce(viewer, group))

  if (!outline) return null

  return (
    <>
      {/* Not in `interactiveLayerIds`: the band never takes a click. */}
      <Source id={OUTLINE_SOURCE_ID} type="geojson" data={outline.polygon}>
        <Layer
          id="changeset-tag-group-fill"
          type="fill"
          beforeId={beforeId}
          paint={{ 'fill-color': TAG_GROUP_FILL }}
        />
        <Layer
          id="changeset-tag-group-line"
          type="line"
          beforeId={beforeId}
          layout={{ 'line-join': 'round' }}
          paint={{ 'line-color': TAG_GROUP_EDGE, 'line-width': 1 }}
        />
      </Source>
      <Marker
        longitude={outline.labelAt[0]}
        latitude={outline.labelAt[1]}
        anchor="center"
        style={{ pointerEvents: 'none' }}
      >
        <div
          role="img"
          aria-label={`Group ${group.code}`}
          className="pointer-events-none font-sans text-sm font-semibold whitespace-nowrap select-none"
          style={TAG_GROUP_CODE_STYLE}
        >
          {group.code}
        </div>
      </Marker>
    </>
  )
}
