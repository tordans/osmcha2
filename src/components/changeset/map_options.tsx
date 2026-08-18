import * as Headless from '@headlessui/react'
import { Square3Stack3DIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'
import { useMapStore } from '../../stores/mapStore.ts'
import { Checkbox, CheckboxField } from '../ui/checkbox.tsx'
import { Divider } from '../ui/divider.tsx'
import { Label } from '../ui/fieldset.tsx'

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

const layerOptions = [
  { label: 'Bing Maps Aerial', value: 'bing' },
  { label: 'Esri World Imagery', value: 'esri' },
  { label: 'Esri World Imagery (Clarity) Beta', value: 'esri-clarity' },
  { label: 'OpenStreetMap Carto', value: 'carto' },
] as const

type MapOptionsProps = {
  showElements: Array<string>
  showActions: Array<string>
  setShowElements: (elements: Array<string>) => void
  setShowActions: (actions: Array<string>) => void
  ref?: React.Ref<HTMLButtonElement>
}

export function MapOptions({
  showElements,
  showActions,
  setShowElements,
  setShowActions,
  ref,
}: MapOptionsProps) {
  const style = useMapStore((state) => state.style)
  const setStyle = useMapStore((state) => state.setStyle)

  return (
    <Headless.Popover>
      <Headless.PopoverButton
        ref={ref}
        aria-label="Map options"
        className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-zinc-950/10 touch-manipulation select-none active:bg-zinc-100"
      >
        <Square3Stack3DIcon className="size-5 text-zinc-700" />
      </Headless.PopoverButton>
      <Headless.PopoverPanel
        anchor="top end"
        className="z-40 w-72 rounded-xl bg-white p-3 shadow-lg ring-1 ring-zinc-950/10"
      >
        <h2 className="mb-2 text-base font-semibold text-zinc-950">Map controls</h2>

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

        <Divider className="my-3" />

        <section className="space-y-1">
          <h3 className="text-base font-medium text-zinc-700">Map style</h3>
          {layerOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStyle(opt.value)}
              className={clsx(
                'flex min-h-11 w-full cursor-pointer items-center rounded-lg px-2 text-left text-base touch-manipulation select-none',
                style === opt.value ? 'bg-zinc-950/5 font-medium' : 'active:bg-zinc-950/5',
              )}
            >
              {opt.label}
            </button>
          ))}
        </section>
      </Headless.PopoverPanel>
    </Headless.Popover>
  )
}
