import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import type * as maplibre from 'maplibre-gl'
import { useMap } from 'react-map-gl/maplibre'
import { useMapLoaded } from '../../stores/map-loaded-store.ts'
import { useMapStore } from '../../stores/mapStore.ts'
import { Checkbox, CheckboxField } from '../ui/checkbox.tsx'
import { Divider } from '../ui/divider.tsx'
import { Label } from '../ui/fieldset.tsx'
import { FunnelIcon, GlobeAltIcon } from '../ui/icons.ts'
import { BUILTIN_BASEMAP_OPTIONS, toEliStyleId } from './basemapStyles.ts'
import {
  isDuplicateOfBuiltinLayer,
  isImageryUsedMatch,
  parseImageryUsed,
} from './matchImageryUsed.ts'
import { useViewportEditorLayers } from './useViewportEditorLayers.ts'

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

const mapControlPanelClassName =
  'z-40 w-80 max-h-[min(70dvh,36rem)] overflow-y-auto rounded-xl bg-white p-3 shadow-lg ring-1 ring-zinc-950/10'

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

function UsedBadge() {
  return (
    <span className="shrink-0 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-xs font-medium text-emerald-800">
      Used
    </span>
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

  return (
    <Headless.Popover>
      {({ open }) => (
        <>
          <Headless.PopoverButton
            aria-label="Background imagery"
            className={mapControlButtonClassName}
          >
            <GlobeAltIcon className="size-5 text-zinc-700" />
          </Headless.PopoverButton>
          <Headless.PopoverPanel anchor="top end" className={mapControlPanelClassName}>
            <h2 className="mb-2 text-base font-semibold text-zinc-950">Background imagery</h2>
            {imageryTokens.length > 0 && (
              <p className="mb-2 text-sm text-zinc-500">
                Changeset used: {imageryTokens.join(', ')}
              </p>
            )}

            <section className="space-y-1">
              {BUILTIN_BASEMAP_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setStyle(opt.id)}
                  className={imageryLayerButtonClassName(style === opt.id)}
                >
                  <span>{opt.label}</span>
                  {isImageryUsedMatch(imageryUsed, opt.label) ||
                  isImageryUsedMatch(imageryUsed, opt.id) ? (
                    <UsedBadge />
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
  const visibleLayers = layers
    .filter((layer) => !isDuplicateOfBuiltinLayer(layer))
    .sort((a, b) => {
      const aUsed = isImageryUsedMatch(imageryUsed, a.name) || isImageryUsedMatch(imageryUsed, a.id)
      const bUsed = isImageryUsedMatch(imageryUsed, b.name) || isImageryUsedMatch(imageryUsed, b.id)
      if (aUsed !== bUsed) return aUsed ? -1 : 1
      if (a.best !== b.best) return a.best ? -1 : 1
      return a.name.localeCompare(b.name)
    })

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
        {visibleLayers.map((layer) => {
          const value = toEliStyleId(layer.id)
          const used =
            isImageryUsedMatch(imageryUsed, layer.name) || isImageryUsedMatch(imageryUsed, layer.id)
          return (
            <button
              key={layer.id}
              type="button"
              onClick={() => setStyle(value)}
              className={imageryLayerButtonClassName(style === value)}
            >
              <span className="min-w-0">
                <span className="block truncate">{layer.name}</span>
                {layer.best ? (
                  <span className="block text-xs font-normal text-zinc-500">
                    Best for this area
                  </span>
                ) : null}
              </span>
              {used ? <UsedBadge /> : null}
            </button>
          )
        })}
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
