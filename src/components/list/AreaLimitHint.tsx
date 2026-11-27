import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useFilters } from '../../hooks/useFilters.ts'
import { useReviewArea } from '../../hooks/useReviewArea.ts'
import { updateAOI } from '../../network/aoi.ts'
import { useAOI } from '../../query/hooks/useAOI.ts'
import {
  useAreaLimitHintActions,
  useIsAreaLimitHintDismissed,
} from '../../stores/area-limit-hint-store.ts'
import { deserializeFiltersFromObject } from '../../utils/filters.ts'
import { parseAreaLt } from '../filters/areaLtBound.ts'
import type { Filters } from '../filters/filterTypes.ts'
import { Button } from '../ui/button.tsx'
import { filterName, useSelectedList } from './useSelectedList.ts'

/**
 * Saved-filter values as the filter form holds them, without `area_lt`. Values the server
 * returns as objects (a geometry) are kept as they are.
 */
export function filtersWithoutAreaLimit(raw: Record<string, unknown>): Filters {
  const strings: Record<string, unknown> = {}
  const objects: Filters = {}
  for (const [key, value] of Object.entries(raw)) {
    if (key === 'area_lt' || value == null) continue
    if (typeof value === 'string') strings[key] = value
    else if (typeof value === 'object') objects[key] = [{ label: value, value }]
    else if (typeof value === 'number') objects[key] = [{ label: String(value), value }]
    // A boolean is kept as the text it is sent as; the saved filter is the same.
    else if (typeof value === 'boolean')
      objects[key] = [{ label: String(value), value: String(value) }]
  }
  return { ...deserializeFiltersFromObject(strings), ...objects }
}

/**
 * Once per saved filter and browser: a filter of your own that caps the changeset bbox size
 * hides large edits that do touch your area. Offers to drop the cap, now that changesets
 * outside the area are flagged and can be skipped.
 */
export function AreaLimitHint() {
  const { aoiId } = useFilters()
  const { selected } = useSelectedList()
  const { data: aoi } = useAOI(aoiId)
  const area = useReviewArea()
  const dismissedHere = useIsAreaLimitHintDismissed(aoiId)
  const { dismiss } = useAreaLimitHintActions()
  const queryClient = useQueryClient()
  const rawFilters = aoi?.properties?.filters
  const areaLimit = parseAreaLt(rawFilters?.area_lt)

  const removeLimit = useMutation({
    mutationFn: () =>
      updateAOI(aoiId!, aoi?.properties?.name ?? '', filtersWithoutAreaLimit(rawFilters ?? {})),
    onSuccess: () => {
      dismiss(aoiId!)
      void queryClient.invalidateQueries({ queryKey: ['aoi', aoiId] })
      void queryClient.invalidateQueries({ queryKey: ['aois'] })
      void queryClient.invalidateQueries({ queryKey: ['changesets'] })
      toast.success('Size limit removed', {
        description: 'Changesets outside your area are flagged in the list.',
      })
    },
    onError: (error: Error) => {
      toast.error('Could not update the filter', { description: error.message })
    },
  })

  // Only your own filters (the ones in your list), with an area and a cap, not yet answered here.
  if (!aoiId || !selected || !aoi || !area || areaLimit == null || dismissedHere) return null

  return (
    <section
      aria-label="Maximum changeset size"
      className="border-b border-amber-300 bg-amber-50 px-3 py-2.5 text-sm/5 text-amber-950"
    >
      <p className="font-semibold">“{filterName(aoi)}” hides large changesets</p>
      <p className="mt-1 text-amber-900">
        It drops every changeset whose bounding box is over {areaLimit}× your area, also large edits
        that do touch it. Without the limit they show up, and the ones with no edit in your area get
        flagged so you can skip them.
      </p>
      <p className="mt-1 text-xs/4 text-amber-800">
        Saved to the filter: osmcha.org and the filter’s RSS feed show the longer list too, without
        the flags.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          color="amber"
          className="min-h-11 touch-manipulation sm:min-h-9"
          disabled={removeLimit.isPending}
          onClick={() => removeLimit.mutate()}
        >
          Remove limit
        </Button>
        <Button
          plain
          className="min-h-11 touch-manipulation sm:min-h-9"
          disabled={removeLimit.isPending}
          onClick={() => dismiss(aoiId)}
        >
          Keep it
        </Button>
      </div>
    </section>
  )
}
