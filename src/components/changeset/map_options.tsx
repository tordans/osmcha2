import * as Headless from '@headlessui/react'
import type { EliCategory, EliLayer } from '@osm-editor-kit/maplibre-editor-layer-index'
import clsx from 'clsx'
import type * as maplibre from 'maplibre-gl'
import { useMap } from 'react-map-gl/maplibre'
import { useMapLoaded } from '../../stores/map-loaded-store.ts'
import { useMapStore } from '../../stores/mapStore.ts'
import { Checkbox, CheckboxField } from '../ui/checkbox.tsx'
import { Divider } from '../ui/divider.tsx'
import { Label } from '../ui/fieldset.tsx'
import { flyoutSurfaceClassName } from '../ui/flyout.ts'
import {
  ChevronDownIcon,
  CircleCheckIcon,
  FunnelIcon,
  GlobeAltIcon,
  StarIcon,
} from '../ui/icons.ts'
import { Tooltip } from '../ui/tooltip.tsx'
import { BUILTIN_BASEMAP_OPTIONS, toEliStyleId } from './basemapStyles.ts'
import {
  isDuplicateOfBuiltinLayer,
  isImageryUsedMatch,
  matchAllImageryUsedSelections,
  matchImageryUsedSelection,
  parseImageryUsed,
} from './matchImageryUsed.ts'
import { useViewportEditorLayers } from './useViewportEditorLayers.ts'

/** ELI category keys in display order (matches Editor Layer Index / iD grouping). */
const ELI_CATEGORY_ORDER = [
  'photo',
  'historicphoto',
  'map',
  'historicmap',
  'osmbasedmap',
  'elevation',
  'qa',
  'other',
] as const satisfies readonly EliCategory[]

const ELI_CATEGORY_LABELS: Record<EliCategory, string> = {
  photo: 'Aerial imagery',
  historicphoto: 'Historic imagery',
  map: 'Maps',
  historicmap: 'Historic maps',
  osmbasedmap: 'OSM-based maps',
  elevation: 'Elevation',
  qa: 'Quality assurance',
  other: 'Misc',
}

function eliCategoryOf(layer: Pick<EliLayer, 'category'>): EliCategory {
  return layer.category ?? 'other'
}

function compareViewportLayers(
  a: EliLayer,
  b: EliLayer,
  imageryUsed: string | null | undefined,
): number {
  const aUsed = isImageryUsedMatch(imageryUsed, a.name) || isImageryUsedMatch(imageryUsed, a.id)
  const bUsed = isImageryUsedMatch(imageryUsed, b.name) || isImageryUsedMatch(imageryUsed, b.id)
  if (aUsed !== bUsed) return aUsed ? -1 : 1
  if (a.best !== b.best) return a.best ? -1 : 1
  return a.name.localeCompare(b.name)
}

function groupViewportLayersByCategory(
  layers: readonly EliLayer[],
  imageryUsed: string | null | undefined,
): Array<{ category: EliCategory; label: string; layers: EliLayer[] }> {
  const byCategory = new Map<EliCategory, EliLayer[]>()
  for (const layer of layers) {
    const category = eliCategoryOf(layer)
    const bucket = byCategory.get(category)
    if (bucket) bucket.push(layer)
    else byCategory.set(category, [layer])
  }

  return ELI_CATEGORY_ORDER.flatMap((category) => {
    const groupLayers = byCategory.get(category)
    if (!groupLayers?.length) return []
    return [
      {
        category,
        label: ELI_CATEGORY_LABELS[category],
        layers: [...groupLayers].sort((a, b) => compareViewportLayers(a, b, imageryUsed)),
      },
    ]
  })
}

type TopImageryRow = {
  styleId: string
  label: string
  used: boolean
}

/** Builtin defaults plus every matched `imagery_used` layer (ELI rows duplicated here). */
function buildTopImageryRows(imageryUsed: string | null | undefined): TopImageryRow[] {
  const usedMatches = matchAllImageryUsedSelections(imageryUsed)
  const usedStyleIds = new Set(usedMatches.map((match) => match.styleId))
  const rows: TopImageryRow[] = usedMatches.map((match) => ({
    styleId: match.styleId,
    label: match.label,
    used: true,
  }))

  for (const option of BUILTIN_BASEMAP_OPTIONS) {
    if (usedStyleIds.has(option.id)) continue
    rows.push({ styleId: option.id, label: option.label, used: false })
  }

  return rows
}

const add = (arr: string[], elem: string): string[] => {
  const set = new Set(arr)
  set.add(elem)
  return Array.from(set)
}

const remove = (arr: string[], elem: string): string[] => {
  const set = new Set(arr)
  set.delete(elem)
  return Array.from(set)
}

const toggle = (arr: string[], elem: string): string[] => {
  return arr.indexOf(elem) === -1 ? add(arr, elem) : remove(arr, elem)
}

const mapControlButtonClassName =
  'inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-zinc-950/10 touch-manipulation select-none active:bg-zinc-100'

const mapControlPanelClassName = clsx(
  'z-40 max-h-[min(70dvh,36rem)] w-80 overflow-y-auto rounded-xl p-3',
  flyoutSurfaceClassName,
)

function imageryLayerButtonClassName(active: boolean) {
  return clsx(
    'flex min-h-11 w-full cursor-pointer touch-manipulation items-center justify-between gap-2 rounded-lg px-2 text-left text-base select-none',
    active ? 'bg-zinc-950/5 font-medium' : 'active:bg-zinc-950/5',
  )
}

type MapFilterOptionsProps = {
  showElements: Array<string>
  showActions: Array<string>
  setShowElements: (elements: Array<string>) => void
  setShowActions: (actions: Array<string>) => void
  ref?: React.Ref<HTMLButtonElement>
}

function MapFilterOptions({
  showElements,
  showActions,
  setShowElements,
  setShowActions,
  ref,
}: MapFilterOptionsProps) {
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
            <CheckboxField>
              <Checkbox
                color="emerald"
                checked={showActions.includes('create')}
                onChange={() => setShowActions(toggle(showActions, 'create'))}
              />
              <Label>Added</Label>
            </CheckboxField>
            <CheckboxField>
              <Checkbox
                color="amber"
                checked={showActions.includes('modify')}
                onChange={() => setShowActions(toggle(showActions, 'modify'))}
              />
              <Label>Modified</Label>
            </CheckboxField>
            <CheckboxField>
              <Checkbox
                color="red"
                checked={showActions.includes('delete')}
                onChange={() => setShowActions(toggle(showActions, 'delete'))}
              />
              <Label>Deleted</Label>
            </CheckboxField>
            <CheckboxField>
              <Checkbox
                color="violet"
                checked={showActions.includes('noop')}
                onChange={() => setShowActions(toggle(showActions, 'noop'))}
              />
              <Label>Unchanged</Label>
            </CheckboxField>
          </div>
        </section>

        <Divider className="my-3" />

        <section className="space-y-2">
          <h3 className="text-base font-medium text-zinc-700">Filter by type</h3>
          <div className="space-y-1">
            <CheckboxField>
              <Checkbox
                checked={showElements.includes('node')}
                onChange={() => setShowElements(toggle(showElements, 'node'))}
              />
              <Label>Nodes</Label>
            </CheckboxField>
            <CheckboxField>
              <Checkbox
                checked={showElements.includes('way')}
                onChange={() => setShowElements(toggle(showElements, 'way'))}
              />
              <Label>Ways</Label>
            </CheckboxField>
            <CheckboxField>
              <Checkbox
                checked={showElements.includes('relation')}
                onChange={() => setShowElements(toggle(showElements, 'relation'))}
              />
              <Label>Relations</Label>
            </CheckboxField>
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

function MapImageryOptions({ imageryUsed }: MapImageryOptionsProps) {
  const { mainMap } = useMap()
  const mapLoaded = useMapLoaded()
  const map = mapLoaded ? (mainMap?.getMap() ?? null) : null
  const style = useMapStore((state) => state.style)
  const setStyle = useMapStore((state) => state.setStyle)
  const imageryTokens = parseImageryUsed(imageryUsed)
  const appliedMatch = matchImageryUsedSelection(imageryUsed)
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
      {({ open }) => (
        <>
          {isAppliedFromChangeset && appliedTooltip ? (
            <Tooltip as="span" content={appliedTooltip} className="inline-flex">
              {imageryButton}
            </Tooltip>
          ) : (
            imageryButton
          )}
          <Headless.PopoverPanel anchor="top end" className={mapControlPanelClassName}>
            <h2 className="mb-2 text-base font-semibold text-zinc-950">Background imagery</h2>
            {imageryTokens.length > 0 && (
              <p
                className={clsx(
                  'mb-2 flex items-start gap-1.5 text-sm',
                  isAppliedFromChangeset ? 'text-emerald-600' : 'text-zinc-500',
                )}
              >
                <ChangesetUsedIcon className="mt-0.5" />
                <span>Changeset used: {imageryTokens.join(', ')}</span>
              </p>
            )}

            <section className="space-y-1">
              {buildTopImageryRows(imageryUsed).map((row) => (
                <button
                  key={row.styleId}
                  type="button"
                  onClick={() => setStyle(row.styleId)}
                  className={imageryLayerButtonClassName(style === row.styleId)}
                >
                  <span className="min-w-0 truncate">{row.label}</span>
                  {row.used ? (
                    <Tooltip
                      as="span"
                      content="Used in this changeset"
                      className="inline-flex shrink-0"
                    >
                      <ChangesetUsedIcon />
                    </Tooltip>
                  ) : null}
                </button>
              ))}
            </section>

            <ViewportEditorLayerList
              enabled={open}
              map={map}
              imageryUsed={imageryUsed}
              style={style}
              setStyle={setStyle}
            />
          </Headless.PopoverPanel>
        </>
      )}
    </Headless.Popover>
  )
}

function ViewportLayerButton({
  layer,
  imageryUsed,
  style,
  setStyle,
}: {
  layer: EliLayer
  imageryUsed?: string | null
  style: string
  setStyle: (style: string) => void
}) {
  const value = toEliStyleId(layer.id)
  const used =
    isImageryUsedMatch(imageryUsed, layer.name) || isImageryUsedMatch(imageryUsed, layer.id)
  return (
    <button
      type="button"
      onClick={() => setStyle(value)}
      className={imageryLayerButtonClassName(style === value)}
    >
      <span className="min-w-0 truncate">{layer.name}</span>
      <span className="flex shrink-0 items-center gap-1">
        {layer.best ? <BestForAreaIcon /> : null}
        {used ? (
          <Tooltip as="span" content="Used in this changeset" className="inline-flex shrink-0">
            <ChangesetUsedIcon />
          </Tooltip>
        ) : null}
      </span>
    </button>
  )
}

function ViewportEditorLayerList({
  enabled,
  map,
  imageryUsed,
  style,
  setStyle,
}: {
  enabled: boolean
  map: maplibre.Map | null
  imageryUsed?: string | null
  style: string
  setStyle: (style: string) => void
}) {
  const { layers, status } = useViewportEditorLayers(map, enabled)
  const visibleLayers = layers.filter((layer) => !isDuplicateOfBuiltinLayer(layer))
  const categoryGroups = groupViewportLayersByCategory(visibleLayers, imageryUsed)

  return (
    <>
      <Divider className="my-3" />
      <section className="space-y-2">
        <h3 className="text-base font-medium text-zinc-700">In this view</h3>
        {status !== 'ready' && visibleLayers.length === 0 ? (
          <p className="px-2 py-2 text-sm text-zinc-500">
            {map ? 'Loading imagery for this view…' : 'Map is still loading…'}
          </p>
        ) : null}
        {status === 'ready' && visibleLayers.length === 0 ? (
          <p className="px-2 py-2 text-sm text-zinc-500">No extra imagery for this view.</p>
        ) : null}
        {categoryGroups.map(({ category, label, layers: groupLayers }) => (
          <Headless.Disclosure key={category} defaultOpen={false}>
            {({ open }) => (
              <div className={clsx('rounded-lg border border-zinc-950/10', open && 'bg-zinc-50')}>
                <Headless.DisclosureButton className="flex min-h-11 w-full cursor-pointer touch-manipulation items-center justify-between gap-2 rounded-lg px-2.5 text-left text-sm font-medium text-zinc-700 select-none active:bg-zinc-950/5">
                  <span className="min-w-0 truncate">
                    {label}
                    <span className="ml-1.5 font-normal text-zinc-500">{groupLayers.length}</span>
                  </span>
                  <ChevronDownIcon
                    className={clsx(
                      'size-4 shrink-0 text-zinc-500 transition',
                      open && 'rotate-180',
                    )}
                  />
                </Headless.DisclosureButton>
                <Headless.DisclosurePanel className="space-y-1 border-t border-zinc-950/10 px-1 py-1">
                  {groupLayers.map((layer) => (
                    <ViewportLayerButton
                      key={layer.id}
                      layer={layer}
                      imageryUsed={imageryUsed}
                      style={style}
                      setStyle={setStyle}
                    />
                  ))}
                </Headless.DisclosurePanel>
              </div>
            )}
          </Headless.Disclosure>
        ))}
      </section>
    </>
  )
}

type MapOptionsProps = {
  showElements: Array<string>
  showActions: Array<string>
  setShowElements: (elements: Array<string>) => void
  setShowActions: (actions: Array<string>) => void
  imageryUsed?: string | null
  ref?: React.Ref<HTMLButtonElement>
}

export function MapOptions({
  showElements,
  showActions,
  setShowElements,
  setShowActions,
  imageryUsed,
  ref,
}: MapOptionsProps) {
  return (
    <Headless.PopoverGroup className="flex flex-col gap-2">
      <MapFilterOptions
        ref={ref}
        showElements={showElements}
        showActions={showActions}
        setShowElements={setShowElements}
        setShowActions={setShowActions}
      />
      <MapImageryOptions imageryUsed={imageryUsed} />
    </Headless.PopoverGroup>
  )
}
