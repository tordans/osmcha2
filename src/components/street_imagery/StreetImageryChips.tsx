import clsx from 'clsx'
import { useStreetImageryViewerActions } from '../../stores/street-imagery-viewer-store.ts'
import { CameraIcon } from '../ui/icons.ts'
import { STREET_IMAGERY_PROVIDER_LABEL, type StreetImageryRowPhoto } from './streetImageryTags.ts'

/**
 * One button per photo in a tag value, below the tag row. A click opens the photo in the viewer
 * dialog. Photos of the old value (a removed row, or a value the change dropped) are dimmed.
 */
export function StreetImageryChips({ photos }: { photos: StreetImageryRowPhoto[] }) {
  const { openPhoto } = useStreetImageryViewerActions()
  if (photos.length === 0) return null

  return (
    <ul
      aria-label="Street-level photos in this value"
      className="col-span-3 col-start-3 flex flex-wrap gap-1 pb-0.5 font-sans @min-[24rem]/tags:col-span-1 @min-[24rem]/tags:col-start-5"
    >
      {photos.map((photo) => {
        const label = `${STREET_IMAGERY_PROVIDER_LABEL[photo.provider]} photo`
        return (
          <li
            key={`${photo.provider}:${photo.id}:${photo.old ? 'old' : 'new'}`}
            className="min-w-0"
          >
            <button
              type="button"
              title={`${label} ${photo.id}${photo.old ? ' (old value)' : ''}`}
              aria-label={`Open ${label} ${photo.id}${photo.old ? ' (old value)' : ''}`}
              onClick={(event) => {
                // The row selects its tag key on click; opening a photo is not that.
                event.stopPropagation()
                openPhoto({ provider: photo.provider, id: photo.id })
              }}
              className={clsx(
                'inline-flex min-h-7 max-w-full cursor-pointer touch-manipulation items-center gap-1 rounded-md bg-white px-1.5 py-0.5 text-[11px] leading-tight text-zinc-800 ring-1 ring-zinc-950/10',
                'hover:bg-zinc-50 hover:ring-zinc-950/20 focus-visible:outline-2 focus-visible:outline-blue-500',
                photo.old && 'opacity-60',
              )}
            >
              <CameraIcon className="size-3.5 flex-none text-zinc-500" aria-hidden />
              <span className="min-w-0 truncate">
                {label}
                {photo.old ? <span className="text-zinc-500"> (old)</span> : null}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
