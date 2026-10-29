import type { NormalizedPhoto } from '@osm-editor-kit/street-imagery'
import { StreetLevelImageryViewer } from '@osm-editor-kit/street-imagery-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import {
  useStreetImageryViewerActions,
  useStreetImageryViewerOpen,
  useStreetImageryViewerPhoto,
} from '../../stores/street-imagery-viewer-store.ts'
import { formatLocalDateTime } from '../../utils/datetime.ts'
import { showStreetImageryPhotoOnMap } from '../../views/streetImageryCamera.ts'
import { RelativeTime } from '../relative_time.tsx'
import { Button } from '../ui/button.tsx'
import { Dialog, DialogTitle } from '../ui/dialog.tsx'
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  LoaderCircleIcon,
  MapPinIcon,
  XMarkIcon,
} from '../ui/icons.ts'
import {
  fetchStreetImageryPhoto,
  StreetImageryPhotoNotFoundError,
  streetImageryPhotoPageUrl,
} from './streetImageryPhoto.ts'
import { configureStreetImagery } from './streetImageryRuntime.ts'
import { STREET_IMAGERY_PROVIDER_LABEL, type StreetImageryRef } from './streetImageryTags.ts'

configureStreetImagery()

// The dialog covers the map, so the viewer's moves along a sequence need not ease it.
function ignorePhotoSelection() {}
function ignoreMapEase() {}

function useStreetImageryPhoto(photo: StreetImageryRef, enabled: boolean) {
  return useQuery({
    queryKey: ['streetImageryPhoto', photo.provider, photo.id],
    queryFn: ({ signal }) => fetchStreetImageryPhoto(photo, signal),
    enabled,
    // A photo's date, creator and position do not change within a visit.
    staleTime: Infinity,
    retry: (failureCount, error) =>
      !(error instanceof StreetImageryPhotoNotFoundError) && failureCount < 2,
  })
}

function PhotoFacts({ photo }: { photo: NormalizedPhoto }) {
  return (
    // div, not p: RelativeTime's tooltip renders a div.
    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm/6 text-zinc-700">
      {photo.capturedAt != null ? (
        <>
          <span>
            Taken <RelativeTime datetime={new Date(photo.capturedAt)} />
          </span>
          <span className="text-zinc-500">({formatLocalDateTime(new Date(photo.capturedAt))})</span>
        </>
      ) : null}
      {photo.creatorName ? <span>by {photo.creatorName}</span> : null}
      {photo.isPano ? <span className="text-zinc-500">360° photo</span> : null}
    </div>
  )
}

function PhotoBody({ photoRef }: { photoRef: StreetImageryRef }) {
  const open = useStreetImageryViewerOpen()
  const { close } = useStreetImageryViewerActions()
  const { mainMap } = useMap()
  const query = useStreetImageryPhoto(photoRef, open)
  // The photo the viewer shows now: stepping along the sequence changes it.
  const [viewed, setViewed] = useState<NormalizedPhoto | null>(null)
  const photo = query.data
  const shown = viewed ?? photo
  const label = STREET_IMAGERY_PROVIDER_LABEL[photoRef.provider]
  const notFound = query.error instanceof StreetImageryPhotoNotFoundError

  function showOnMap() {
    const map = mainMap?.getMap()
    if (!shown || !map) return
    close()
    showStreetImageryPhotoOnMap(map, {
      provider: photoRef.provider,
      id: shown.photoId,
      lng: shown.lngLat[0],
      lat: shown.lngLat[1],
    })
  }

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <DialogTitle>{label} photo</DialogTitle>
          <p className="mt-0.5 font-mono text-xs/5 break-all text-zinc-500">{photoRef.id}</p>
        </div>
        <Button
          plain
          type="button"
          aria-label="Close"
          onClick={close}
          className="-mt-2.5 -mr-2.5 min-w-11 sm:-mt-1.5 sm:-mr-1.5 sm:min-w-9"
        >
          <XMarkIcon />
        </Button>
      </div>

      {shown ? <PhotoFacts photo={shown} /> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          color="blue"
          disabled={!shown || !mainMap}
          onClick={showOnMap}
          className="flex-1 sm:flex-none"
        >
          <MapPinIcon />
          Show on map
        </Button>
        <Button
          outline
          href={streetImageryPhotoPageUrl(photoRef)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 sm:flex-none"
        >
          <ArrowTopRightOnSquareIcon />
          Open on {label}
        </Button>
      </div>

      {query.isLoading ? (
        <div
          role="status"
          className="mt-8 mb-4 flex items-center justify-center gap-2 text-sm/6 text-zinc-600"
        >
          <LoaderCircleIcon className="size-5 animate-spin text-zinc-400" aria-hidden />
          Loading photo…
        </div>
      ) : null}

      {query.isError ? (
        <div role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm/6 text-red-800">
          <p>
            {notFound
              ? `${label} has no photo for this id. It may have been deleted.`
              : `The photo could not be loaded from ${label}.`}
          </p>
          {notFound ? null : (
            <Button
              type="button"
              outline
              className="mt-2 w-full sm:w-auto"
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              <ArrowPathIcon />
              Try again
            </Button>
          )}
        </div>
      ) : null}

      {photo ? (
        // The panels set their own 4:3 shape; the dialog sets the height instead, so a wide
        // dialog does not make the viewer taller than the screen.
        <div className="relative mt-4 h-[min(42dvh,36rem)] overflow-hidden rounded-lg sm:h-[min(55dvh,36rem)] [&>div]:aspect-auto! [&>div]:h-full!">
          <StreetLevelImageryViewer
            photo={photo}
            groupPhotos={[]}
            onPhotoSelected={ignorePhotoSelection}
            onEaseMapToPoint={ignoreMapEase}
            onViewerPhoto={setViewed}
          />
        </div>
      ) : null}
      <div className="pb-[env(safe-area-inset-bottom)]" />
    </>
  )
}

/**
 * The dialog of `StreetImageryDialog`, in its own chunk with the viewer. A bottom sheet on phones
 * (the Catalyst dialog sits at the bottom there), a large centred dialog from `sm`.
 */
export default function StreetImageryDialogContent() {
  const photo = useStreetImageryViewerPhoto()
  const open = useStreetImageryViewerOpen()
  const { close } = useStreetImageryViewerActions()

  return (
    <Dialog
      open={open}
      onClose={close}
      size="5xl"
      className="max-h-[85dvh] overflow-y-auto [--gutter:--spacing(5)]! sm:[--gutter:--spacing(6)]!"
    >
      {photo ? <PhotoBody key={`${photo.provider}/${photo.id}`} photoRef={photo} /> : null}
    </Dialog>
  )
}
