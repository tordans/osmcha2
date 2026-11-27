import type { MapLayerMouseEvent } from 'react-map-gl/maplibre'
import { ACTION } from '../components/changeset/actionColors.ts'
import { InspectKindSwatch } from '../components/changeset/InspectKindSwatch.tsx'
import { flyoutSurfaceClassName } from '../components/ui/flyout.ts'
import { inspectFlyoutTags, type InspectHover, type InspectHoverItem } from './spyglassOverlay.ts'

export type InspectPoint = { x: number; y: number; width: number; openLeft: boolean }

/** In the right half of the map the flyout opens to the left, so a tap near the edge stays readable. */
export function inspectPointOf(event: MapLayerMouseEvent): InspectPoint {
  const width = event.target.getContainer().clientWidth
  return { x: event.point.x, y: event.point.y, width, openLeft: event.point.x > width / 2 }
}

export function SpyglassInspectFlyout({
  hover,
  point,
}: {
  hover: InspectHover
  point: InspectPoint
}) {
  return (
    <div
      className={`pointer-events-none absolute z-20 max-w-xs rounded-lg px-2 py-1.5 ${flyoutSurfaceClassName}`}
      style={
        point.openLeft
          ? { right: point.width - point.x + 12, top: point.y + 12 }
          : { left: point.x + 12, top: point.y + 12 }
      }
    >
      {hover.items.map((item, index) => (
        <SpyglassInspectFlyoutItem
          key={`${item.type}/${String(item.id)}`}
          item={item}
          isFirst={index === 0}
        />
      ))}
      {hover.extraCount > 0 ? (
        <div className="mt-1 text-xs text-zinc-500">+{hover.extraCount} more</div>
      ) : null}
    </div>
  )
}

function SpyglassInspectFlyoutItem({
  item,
  isFirst,
}: {
  item: InspectHoverItem
  isFirst: boolean
}) {
  const { tags, moreCount } = inspectFlyoutTags(item.tags)
  return (
    <div className={isFirst ? undefined : 'mt-2'}>
      <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-950">
        <InspectKindSwatch kind={item.kind} />
        <span>
          <span className="sr-only">{item.kind === 'noop' ? ACTION.noop.label : 'OSM'} </span>
          {item.type}/{item.id}
        </span>
      </div>
      {tags.length > 0 ? (
        <div className="mt-1 text-xs text-zinc-700">
          {tags.map(([key, value]) => (
            <div key={key} className="truncate">
              {key}={value}
            </div>
          ))}
        </div>
      ) : null}
      {moreCount > 0 ? <div className="mt-1 text-xs text-zinc-500">+{moreCount} more</div> : null}
    </div>
  )
}
