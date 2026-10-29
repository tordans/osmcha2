import { PhotoDateRangeFilter } from '@osm-editor-kit/street-imagery-react'
import {
  useEffectiveStreetImageryDate,
  useStreetImageryDate,
  useStreetImageryLayerActions,
} from '../../stores/street-imagery-layer-store.ts'
import { DEFAULT_PHOTO_MAX_AGE_YEARS } from './streetImageryLayerSettings.ts'

/**
 * The package's date slider for the photo layer, in a chunk of its own: it loads when the panel
 * first shows it. Choosing a range replaces the default (the last two years) until reset.
 */
export default function StreetImageryDateFilter() {
  const date = useEffectiveStreetImageryDate()
  const chosen = useStreetImageryDate()
  const { setDate } = useStreetImageryLayerActions()

  return (
    <div className="space-y-2">
      <PhotoDateRangeFilter
        value={date}
        onChange={setDate}
        yearLines={[1, 2, 3, 4]}
        recommendedMaxAgeYears={DEFAULT_PHOTO_MAX_AGE_YEARS}
      />
      {chosen !== null ? (
        <button
          type="button"
          onClick={() => setDate(null)}
          className="min-h-9 cursor-pointer touch-manipulation text-sm text-zinc-600 underline decoration-zinc-400 underline-offset-2 hover:text-zinc-900"
        >
          Back to the last {DEFAULT_PHOTO_MAX_AGE_YEARS} years
        </button>
      ) : null}
    </div>
  )
}
