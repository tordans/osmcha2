import * as Headless from '@headlessui/react'
import { getRouteApi } from '@tanstack/react-router'
import clsx from 'clsx'
import type * as maplibre from 'maplibre-gl'
import { lazy, Suspense } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { BUILTIN_BASEMAP_OPTIONS } from '../../map/basemapIds.ts'
import {
  mapLayerIsOn,
  parseLayersParam,
  reviewFilterOf,
  searchWithLayers,
  setReviewFilter,
  toggleMapLayer,
  type MapLayerToken,
  type MapLayers,
  type ReviewFilter,
} from '../../routing/layersParam.ts'
import { parseMapParam } from '../../routing/mapParam.ts'
import { useMapLoaded } from '../../stores/map-loaded-store.ts'
import { useMapStyle, useMapStyleActions } from '../../stores/map-style-store.ts'
import {
  useMapillaryLayerOn,
  usePanoramaxLayerOn,
  useStreetImageryLayerActions,
  useStreetImageryLayerOn,
  useStreetImageryPhotoKind,
} from '../../stores/street-imagery-layer-store.ts'
import { SEEN_FILTER } from '../../views/changesetSeenStyle.ts'
import type { StreetImageryPhotoKind } from '../street_imagery/streetImageryLayerSettings.ts'
import { Checkbox, CheckboxField } from '../ui/checkbox.tsx'
import { Divider } from '../ui/divider.tsx'
import { Label } from '../ui/fieldset.tsx'
import { flyoutSurfaceClassName } from '../ui/flyout.ts'
import { CameraIcon, CircleCheckIcon, FunnelIcon, GlobeAltIcon, StarIcon } from '../ui/icons.ts'
import { Radio, RadioField } from '../ui/radio.tsx'
import { Tooltip } from '../ui/tooltip.tsx'
import { ACTION } from './actionColors.ts'
import { ActionIcon } from './ActionTypeLabel.tsx'
import {
  buildImageryRows,
  groupRows,
  rowIsShown,
  type ImageryChip,
  type ImageryRow,
} from './imageryRows.ts'
import { InspectKindSwatch } from './InspectKindSwatch.tsx'
import {
  isDuplicateOfBuiltinLayer,
  resolveImageryUsed,
  type ImageryUsedResolution,
} from './matchImageryUsed.ts'
import { openInUrls } from './openInUrls.ts'
import { useViewportEditorLayers } from './useViewportEditorLayers.ts'

// The date slider comes with the street-imagery package; it loads when the panel first shows it.
const StreetImageryDateFilter = lazy(() => import('../street_imagery/StreetImageryDateFilter.tsx'))

const changesetRouteApi = getRouteApi('/changesets/$id')

type TopImageryRow = {
  styleId: string
  label: string
  used: boolean
}

/** Every layer the changeset used first, then the built-in defaults that it did not use. */
function buildTopImageryRows(resolution: ImageryUsedResolution): TopImageryRow[] {
  const rows: TopImageryRow[] = resolution.matches.map((match) => ({
    styleId: match.styleId,
    label: match.label,
    used: true,
  }))
  const usedStyleIds = new Set(rows.map((row) => row.styleId))

  for (const option of BUILTIN_BASEMAP_OPTIONS) {
    if (usedStyleIds.has(option.id)) continue
    rows.push({ styleId: option.id, label: option.label, used: false })
  }

  return rows
}

const mapControlButtonClassName =
  'inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-zinc-950/10 touch-manipulation select-none active:bg-zinc-100'

const mapControlPanelClassName = clsx(
  'z-40 max-h-[min(70dvh,36rem)] w-80 overflow-y-auto rounded-xl p-3',
  flyoutSurfaceClassName,
)

// Names are long ("Berlin/Geoportal DOP20RGB"), so the list gets the width the screen gives it.
// Tall enough for a phone held sideways, scrolling beyond that.
const imageryPanelClassName = clsx(
  'z-40 max-h-[min(80dvh,40rem)] w-[min(32rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-xl p-3',
  flyoutSurfaceClassName,
)

function imageryLayerButtonClassName(active: boolean) {
  return clsx(
    'flex min-h-11 w-full cursor-pointer touch-manipulation items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-base select-none',
    active ? 'bg-zinc-950/5 font-medium' : 'active:bg-zinc-950/5',
  )
}

function MapLayerCheckbox({
  token,
  layers,
  onToggle,
  colorClass,
  children,
  description,
  action,
}: {
  token: MapLayerToken
  layers: MapLayers
  onToggle: (token: MapLayerToken) => void
  colorClass?: string
  children: React.ReactNode
  description?: string
  action?: React.ReactNode
}) {
  return (
    // 44px rows on phones so each toggle is an easy tap; tighter rows from sm up.
    <CheckboxField className="min-h-11 items-center sm:min-h-0 sm:items-start">
      <Checkbox
        colorClass={colorClass}
        checked={mapLayerIsOn(layers, token)}
        onChange={() => onToggle(token)}
      />
      <Label>
        {children}
        {description ? (
          <span className="-mt-0.5 block text-sm/4 font-normal text-zinc-500">{description}</span>
        ) : null}
      </Label>
      {action}
    </CheckboxField>
  )
}

type MapFilterOptionsProps = {
  ref?: React.Ref<HTMLButtonElement>
}

function MapFilterOptions({ ref }: MapFilterOptionsProps) {
  const { layers: layersSearch, map: mapSearch } = changesetRouteApi.useSearch()
  const navigate = changesetRouteApi.useNavigate()
  const { id: changesetId } = changesetRouteApi.useParams()
  const { mainMap } = useMap()
  const mapLoaded = useMapLoaded()
  const layers = parseLayersParam(layersSearch)
  // `?map=` is missing until the first pan; fall back to the live camera for the Spyglass link.
  const liveCenter = mapLoaded ? mainMap?.getCenter() : undefined
  const camera =
    parseMapParam(mapSearch ?? '') ??
    (mainMap && liveCenter
      ? { zoom: mainMap.getZoom(), lat: liveCenter.lat, lng: liveCenter.lng }
      : null)

  function toggleLayer(token: MapLayerToken) {
    void navigate({
      search: (prev) =>
        searchWithLayers(prev, toggleMapLayer(parseLayersParam(prev.layers), token)),
      replace: true,
    })
  }

  function setReview(filter: ReviewFilter) {
    void navigate({
      search: (prev) =>
        searchWithLayers(prev, setReviewFilter(parseLayersParam(prev.layers), filter)),
      replace: true,
    })
  }

  return (
    <Headless.Popover>
      <Headless.PopoverButton
        ref={ref}
        aria-label="Filter map"
        className={mapControlButtonClassName}
      >
        <FunnelIcon className="size-5 text-zinc-700" />
      </Headless.PopoverButton>
      <Headless.PopoverPanel anchor="top end" className={mapControlPanelClassName}>
        <h2 className="mb-2 text-base font-semibold text-zinc-950">Filter map</h2>

        <section className="space-y-2">
          <h3 className="text-base font-medium text-zinc-700">Filter by actions</h3>
          <div className="space-y-1">
            <MapLayerCheckbox
              token="create"
              colorClass={ACTION.create.checkbox}
              layers={layers}
              onToggle={toggleLayer}
            >
              <span className="inline-flex items-center gap-1.5">
                <ActionIcon action="create" className={clsx('size-4', ACTION.create.tagText)} />
                {ACTION.create.filterLabel}
              </span>
            </MapLayerCheckbox>
            <MapLayerCheckbox
              token="modify"
              colorClass={ACTION.modify.checkbox}
              layers={layers}
              onToggle={toggleLayer}
            >
              <span className="inline-flex items-center gap-1.5">
                <ActionIcon action="modify" className={clsx('size-4', ACTION.modify.tagText)} />
                {ACTION.modify.filterLabel}
              </span>
            </MapLayerCheckbox>
            <MapLayerCheckbox
              token="delete"
              colorClass={ACTION.delete.checkbox}
              layers={layers}
              onToggle={toggleLayer}
            >
              <span className="inline-flex items-center gap-1.5">
                <ActionIcon action="delete" className={clsx('size-4', ACTION.delete.tagText)} />
                {ACTION.delete.filterLabel}
              </span>
            </MapLayerCheckbox>
            <MapLayerCheckbox
              token="noop"
              colorClass={ACTION.noop.checkbox}
              layers={layers}
              onToggle={toggleLayer}
            >
              <span className="inline-flex items-center gap-1.5">
                <InspectKindSwatch kind="noop" />
                {ACTION.noop.filterLabel}
              </span>
            </MapLayerCheckbox>
          </div>
        </section>

        <Divider className="my-3" />

        <section className="space-y-2">
          <h3 className="text-base font-medium text-zinc-700">Filter by review</h3>
          <Headless.RadioGroup<'div', ReviewFilter>
            value={reviewFilterOf(layers)}
            onChange={(value) => setReview(value)}
            className="space-y-0.5"
            aria-label="Filter by review"
          >
            <RadioField className="min-h-11 items-center sm:min-h-0 sm:items-start">
              <Radio value="unseen" />
              <Label>
                <span className="inline-flex items-center gap-1.5">
                  <SeenLegendSwatch seen={false} />
                  {SEEN_FILTER.unseenLabel}
                </span>
              </Label>
            </RadioField>
            <RadioField className="min-h-11 items-center sm:min-h-0 sm:items-start">
              <Radio value="seen" color="zinc" />
              <Label>
                <span className="inline-flex items-center gap-1.5">
                  <SeenLegendSwatch seen />
                  {SEEN_FILTER.label}
                </span>
              </Label>
            </RadioField>
          </Headless.RadioGroup>
        </section>

        <Divider className="my-3" />

        <section className="space-y-2">
          <h3 className="text-base font-medium text-zinc-700">Layers</h3>
          <div className="space-y-1">
            <MapLayerCheckbox token="node" layers={layers} onToggle={toggleLayer}>
              Nodes
            </MapLayerCheckbox>
            <MapLayerCheckbox token="way" layers={layers} onToggle={toggleLayer}>
              Ways
            </MapLayerCheckbox>
            <MapLayerCheckbox token="relation" layers={layers} onToggle={toggleLayer}>
              Relations
            </MapLayerCheckbox>
            <div className="pt-1 text-sm/5 text-zinc-500">
              <span className="inline-flex items-center gap-1.5 font-medium text-zinc-700">
                <InspectKindSwatch kind="spyglass" />
                OSM context (Spyglass)
              </span>
              <p>
                Not available here yet. Spyglass serves its tiles to allow-listed sites only, and
                OSMCha2 is not one of them.
              </p>
              <a
                href={openInUrls(changesetId, camera).spyglass}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-zinc-400 underline-offset-2 hover:text-zinc-700 hover:decoration-zinc-600"
              >
                Open this map view in Spyglass
              </a>
            </div>
          </div>
        </section>
      </Headless.PopoverPanel>
    </Headless.Popover>
  )
}

function BestForAreaIcon() {
  return (
    <Tooltip as="span" content="Best for this area" className="inline-flex shrink-0">
      <StarIcon variant="fill" className="size-4 text-yellow-500" aria-hidden="true" />
    </Tooltip>
  )
}

/** Matches the compact mark-seen control: white+outline vs zinc+filled check. */
function SeenLegendSwatch({ seen }: { seen: boolean }) {
  return (
    <span
      aria-hidden
      className={clsx(
        'inline-flex size-4 shrink-0 items-center justify-center rounded border border-zinc-950/10',
        seen ? 'bg-zinc-800 text-white' : 'bg-white text-zinc-700 shadow-sm',
      )}
    >
      <CircleCheckIcon className="size-3" variant={seen ? 'fill' : 'outline'} />
    </span>
  )
}

function ChangesetUsedIcon({ className }: { className?: string }) {
  return (
    <CircleCheckIcon
      variant="fill"
      className={clsx('size-4 shrink-0 text-emerald-600', className)}
      aria-hidden="true"
    />
  )
}

type MapImageryOptionsProps = {
  imageryUsed?: string | null
}

function UsedInChangesetNote({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-0.5 flex items-start gap-1 text-sm/5 font-normal text-emerald-700">
      <CircleCheckIcon
        variant="fill"
        className="mt-0.5 size-3.5 shrink-0 text-emerald-600"
        aria-hidden="true"
      />
      <span>{children}</span>
    </span>
  )
}

function MapImageryOptions({ imageryUsed }: MapImageryOptionsProps) {
  const { mainMap } = useMap()
  const mapLoaded = useMapLoaded()
  const map = mapLoaded ? (mainMap?.getMap() ?? null) : null
  const style = useMapStyle()
  const { setStyle } = useMapStyleActions()
  const resolution = resolveImageryUsed(imageryUsed)
  const appliedMatch = resolution.matches[0] ?? null
  const isAppliedFromChangeset = appliedMatch !== null && style === appliedMatch.styleId
  const appliedTooltip = appliedMatch
    ? `Applied background layer ${appliedMatch.label} that was used in this changeset.`
    : null

  const imageryButton = (
    <Headless.PopoverButton
      aria-label={appliedTooltip ?? 'Background imagery'}
      className={mapControlButtonClassName}
    >
      <GlobeAltIcon
        className={clsx('size-5', isAppliedFromChangeset ? 'text-emerald-600' : 'text-zinc-700')}
      />
    </Headless.PopoverButton>
  )

  return (
    <Headless.Popover>
      {({ open }: { open: boolean }) => (
        <>
          {isAppliedFromChangeset && appliedTooltip ? (
            <Tooltip
              as="span"
              content={appliedTooltip}
              placement="bottom-right"
              className="inline-flex"
            >
              {imageryButton}
            </Tooltip>
          ) : (
            imageryButton
          )}
          <Headless.PopoverPanel anchor="top end" className={imageryPanelClassName}>
            <h2 className="mb-2 text-base font-semibold text-zinc-950">Background imagery</h2>
            <ChangesetImageryNote resolution={resolution} />

            <section className="space-y-1">
              {buildTopImageryRows(resolution).map((row) => (
                <button
                  key={row.styleId}
                  type="button"
                  aria-pressed={style === row.styleId}
                  onClick={() => setStyle(row.styleId)}
                  className={imageryLayerButtonClassName(style === row.styleId)}
                >
                  <span className="min-w-0 break-words">
                    {row.label}
                    {row.used ? (
                      <UsedInChangesetNote>Used in this changeset</UsedInChangesetNote>
                    ) : null}
                  </span>
                </button>
              ))}
            </section>

            <ViewportEditorLayerList
              enabled={open}
              map={map}
              resolution={resolution}
              style={style}
              setStyle={setStyle}
            />
          </Headless.PopoverPanel>
        </>
      )}
    </Headless.Popover>
  )
}

/** What the changeset says it used, in full, and what of it the map cannot show. */
function ChangesetImageryNote({ resolution }: { resolution: ImageryUsedResolution }) {
  if (resolution.tokens.length === 0) return null
  const unavailable = resolution.unmatched
  return (
    <div className="mb-2 space-y-1 text-sm/5 text-zinc-500">
      <p className="flex items-start gap-1.5">
        <ChangesetUsedIcon className="mt-0.5" />
        <span className="min-w-0 break-words">Changeset used: {resolution.tokens.join('; ')}</span>
      </p>
      {unavailable.length > 0 ? (
        <p className="pl-5.5 break-words">
          Not available as a background here: {unavailable.join('; ')}
        </p>
      ) : null}
    </div>
  )
}

function DateChip({
  chip,
  active,
  setStyle,
}: {
  chip: ImageryChip
  active: boolean
  setStyle: (style: string) => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      title={chip.used ? `${chip.name} (used in this changeset)` : chip.name}
      onClick={() => setStyle(chip.styleId)}
      className={clsx(
        'inline-flex min-h-9 cursor-pointer touch-manipulation items-center gap-1 rounded-md px-2.5 text-sm tabular-nums ring-1 select-none',
        active
          ? 'bg-zinc-900 font-medium text-white ring-zinc-900'
          : 'bg-white text-zinc-700 ring-zinc-950/15 active:bg-zinc-100',
      )}
    >
      <span>{chip.label}</span>
      {chip.best ? (
        <StarIcon
          variant="fill"
          className="size-3.5 shrink-0 text-yellow-500"
          aria-label="Best for this area"
        />
      ) : null}
      {chip.used ? (
        <CircleCheckIcon
          variant="fill"
          className={clsx('size-3.5 shrink-0', active ? 'text-emerald-400' : 'text-emerald-600')}
          aria-label="Used in this changeset"
        />
      ) : null}
    </button>
  )
}

/**
 * A background of the view. A series (one imagery, many dates) is one row with its dates as buttons under
 * it; a click on the row picks the date the changeset used, else ELI's best date, else the newest.
 */
function ImageryRowView({
  row,
  style,
  setStyle,
}: {
  row: ImageryRow
  style: string
  setStyle: (style: string) => void
}) {
  const shown = rowIsShown(row, style)
  return (
    <div className={clsx('rounded-lg', shown && 'bg-zinc-950/5')}>
      <button
        type="button"
        aria-pressed={shown}
        onClick={() => setStyle(row.styleId)}
        className={clsx(
          'flex min-h-11 w-full cursor-pointer touch-manipulation items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-base select-none',
          shown ? 'font-medium' : 'active:bg-zinc-950/5',
        )}
      >
        <span className="min-w-0 break-words">
          {row.name}
          {row.used ? <UsedInChangesetNote>Used in this changeset</UsedInChangesetNote> : null}
          {row.usedOtherDate ? (
            <UsedInChangesetNote>
              Another date of this was used in this changeset
            </UsedInChangesetNote>
          ) : null}
        </span>
        {row.best ? <BestForAreaIcon /> : null}
      </button>
      {row.chips.length > 0 ? (
        <div
          role="group"
          aria-label={`${row.name}: dates`}
          className="flex flex-wrap gap-1.5 px-2 pb-2"
        >
          {row.chips.map((chip) => (
            <DateChip
              key={chip.styleId}
              chip={chip}
              active={style === chip.styleId}
              setStyle={setStyle}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function ViewportEditorLayerList({
  enabled,
  map,
  resolution,
  style,
  setStyle,
}: {
  enabled: boolean
  map: maplibre.Map | null
  resolution: ImageryUsedResolution
  style: string
  setStyle: (style: string) => void
}) {
  const { layers, status } = useViewportEditorLayers(map, enabled)
  const visibleLayers = layers.filter((layer) => !isDuplicateOfBuiltinLayer(layer))
  const rows = buildImageryRows(
    visibleLayers,
    new Set(resolution.matches.map((match) => match.styleId)),
    new Set(resolution.similar.map((match) => match.styleId)),
  )
  const groups = groupRows(rows)

  return (
    <>
      <Divider className="my-3" />
      <section className="space-y-1">
        <h3 className="text-base font-medium text-zinc-700">In this view</h3>
        {status !== 'ready' && visibleLayers.length === 0 ? (
          <p className="px-2 py-2 text-sm text-zinc-500">
            {map ? 'Loading imagery for this view…' : 'Map is still loading…'}
          </p>
        ) : null}
        {status === 'ready' && visibleLayers.length === 0 ? (
          <p className="px-2 py-2 text-sm text-zinc-500">No extra imagery for this view.</p>
        ) : null}
        {groups.map((group) => (
          <div key={group.id} role="group" aria-label={group.label} className="space-y-1">
            <h4 className="px-2 pt-3 text-sm font-medium text-zinc-500">{group.label}</h4>
            {group.rows.map((row) => (
              <ImageryRowView key={row.key} row={row} style={style} setStyle={setStyle} />
            ))}
          </div>
        ))}
      </section>
    </>
  )
}

const PHOTO_KIND_OPTIONS: { value: StreetImageryPhotoKind; label: string }[] = [
  { value: 'all', label: 'All photos' },
  { value: 'flat', label: 'Flat photos' },
  { value: 'pano', label: '360° photos' },
]

function MapStreetImageryOptions() {
  const layerOn = useStreetImageryLayerOn()
  const mapillaryOn = useMapillaryLayerOn()
  const panoramaxOn = usePanoramaxLayerOn()
  const photoKind = useStreetImageryPhotoKind()
  const { setProviderOn, setPhotoKind } = useStreetImageryLayerActions()

  return (
    <Headless.Popover>
      <Headless.PopoverButton
        aria-label={layerOn ? 'Street-level photos (on)' : 'Street-level photos'}
        className={mapControlButtonClassName}
      >
        <CameraIcon className={clsx('size-5', layerOn ? 'text-sky-600' : 'text-zinc-700')} />
      </Headless.PopoverButton>
      <Headless.PopoverPanel anchor="top end" className={imageryPanelClassName}>
        <h2 className="mb-2 text-base font-semibold text-zinc-950">Street-level photos</h2>

        <section className="space-y-1">
          <h3 className="text-base font-medium text-zinc-700">Show on the map</h3>
          <CheckboxField className="min-h-11 items-center sm:min-h-0 sm:items-start">
            <Checkbox
              checked={mapillaryOn}
              onChange={(checked) => setProviderOn('mapillary', checked)}
            />
            <Label>
              Mapillary
              <span className="-mt-0.5 block text-sm/4 font-normal text-zinc-500">
                Photos by anyone, flat and 360°
              </span>
            </Label>
          </CheckboxField>
          <CheckboxField className="min-h-11 items-center sm:min-h-0 sm:items-start">
            <Checkbox
              checked={panoramaxOn}
              onChange={(checked) => setProviderOn('panoramax', checked)}
            />
            <Label>
              Panoramax
              <span className="-mt-0.5 block text-sm/4 font-normal text-zinc-500">
                Open photos, a community alternative
              </span>
            </Label>
          </CheckboxField>
        </section>

        {layerOn ? (
          <>
            <p className="mt-2 text-sm/5 text-zinc-500">
              Click a dot on the map to see the photo. Photos show once the map is zoomed in to
              street level.
            </p>

            <Divider className="my-3" />

            <section className="space-y-2">
              <h3 className="text-base font-medium text-zinc-700">Photo type</h3>
              <Headless.RadioGroup<'div', StreetImageryPhotoKind>
                value={photoKind}
                onChange={setPhotoKind}
                className="space-y-0.5"
                aria-label="Photo type"
              >
                {PHOTO_KIND_OPTIONS.map((option) => (
                  <RadioField
                    key={option.value}
                    className="min-h-11 items-center sm:min-h-0 sm:items-start"
                  >
                    <Radio value={option.value} />
                    <Label>{option.label}</Label>
                  </RadioField>
                ))}
              </Headless.RadioGroup>
            </section>

            <Divider className="my-3" />

            <section className="space-y-2">
              <h3 className="text-base font-medium text-zinc-700">Photo date</h3>
              <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
                <StreetImageryDateFilter />
              </Suspense>
            </section>
          </>
        ) : null}
      </Headless.PopoverPanel>
    </Headless.Popover>
  )
}

type MapOptionsProps = {
  imageryUsed?: string | null
  ref?: React.Ref<HTMLButtonElement>
}

export function MapOptions({ imageryUsed, ref }: MapOptionsProps) {
  return (
    <Headless.PopoverGroup className="flex flex-col gap-2">
      <MapFilterOptions ref={ref} />
      <MapImageryOptions imageryUsed={imageryUsed} />
      <MapStreetImageryOptions />
    </Headless.PopoverGroup>
  )
}
