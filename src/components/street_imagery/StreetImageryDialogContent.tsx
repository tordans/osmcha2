import {
  providerExternalLink,
  type NormalizedPhoto,
  type PhotoView,
} from '@osm-editor-kit/street-imagery'
import { StreetLevelImageryViewer } from '@osm-editor-kit/street-imagery-react/viewer'
import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { toast } from 'sonner'
import mapillaryLogoUrl from '../../assets/mapillary-logo.svg'
import { isDesktopLayout, useDesktopLayout } from '../../layout/useDesktopLayout.ts'
import { getReviewSheetPosition } from '../../stores/review-sheet-store.ts'
import {
  useStreetImageryViewerActions,
  useStreetImageryViewerOpen,
  useStreetImageryViewerPhoto,
} from '../../stores/street-imagery-viewer-store.ts'
import { moveReviewSheet } from '../../views/reviewCamera.ts'
import { keepInViewAbovePanel } from '../../views/temporaryPinCamera.ts'
import type { SheetPosition } from '../changeset/reviewSheetSnap.ts'
import { RelativeTime } from '../relative_time.tsx'
import { Button } from '../ui/button.tsx'
import { Dialog, DialogTitle } from '../ui/dialog.tsx'
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardIcon,
  LoaderCircleIcon,
  XMarkIcon,
} from '../ui/icons.ts'
import { useDraggableWindow } from '../ui/useDraggableWindow.ts'
import {
  fetchStreetImageryPhoto,
  StreetImageryPhotoNotFoundError,
  streetImageryPhotoPageUrl,
} from './streetImageryPhoto.ts'
import { configureStreetImagery } from './streetImageryRuntime.ts'
import { STREET_IMAGERY_PROVIDER_LABEL, type StreetImageryRef } from './streetImageryTags.ts'

configureStreetImagery()

/**
 * A white frame on top of the photo, inset into the window: the photo itself keeps square corners,
 * so it meets the header in a straight line and only the frame rounds the window.
 */
const WINDOW_FRAME_CLASS_NAME =
  "after:pointer-events-none after:absolute after:inset-0 after:z-20 after:rounded-2xl after:ring-2 after:ring-white after:content-[''] after:ring-inset"
const DIALOG_FRAME_CLASS_NAME =
  "sm:after:pointer-events-none sm:after:absolute sm:after:inset-0 sm:after:z-20 sm:after:rounded-2xl sm:after:ring-2 sm:after:ring-white sm:after:content-[''] sm:after:ring-inset"

const ACTION_BUTTON_CLASS_NAME = 'flex-1 whitespace-nowrap max-sm:text-sm/5 min-[56rem]:flex-none'

// The dialog follows the photo itself (`followPhoto`): the viewer need not ease the map.
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

/** Who took the photo and when: we hide the viewer's own credit, so it has to show here. */
function PhotoCredit({
  provider,
  label,
  photo,
}: {
  provider: StreetImageryRef['provider']
  label: string
  photo: NormalizedPhoto | null | undefined
}) {
  return (
    // div, not p: RelativeTime's tooltip renders a div.
    <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-sm/6 text-zinc-700">
      {provider === 'mapillary' ? (
        <img src={mapillaryLogoUrl} alt="Mapillary" className="h-3.5" />
      ) : (
        <span className="font-medium">{label}</span>
      )}
      {photo?.capturedAt != null ? (
        <span>
          <RelativeTime datetime={new Date(photo.capturedAt)} addSuffix={false} /> old
        </span>
      ) : null}
      {photo?.creatorName ? <span>by {photo.creatorName}</span> : null}
      {photo?.isPano ? <span className="text-zinc-500">360°</span> : null}
      {provider === 'mapillary' ? <span className="text-zinc-500">CC BY-SA</span> : null}
    </div>
  )
}

function WindowTitle({ className, children }: { className?: string; children: ReactNode }) {
  return <h2 className={className}>{children}</h2>
}

function PhotoBody({
  photoRef,
  onDismiss,
  onBackToReview,
  Title,
  dragHandle,
}: {
  photoRef: StreetImageryRef
  onDismiss: () => void
  onBackToReview: () => void
  Title: ComponentType<{ className?: string; children: ReactNode }>
  /** In the desktop window: the header moves it. */
  dragHandle?: HTMLAttributes<HTMLDivElement>
}) {
  const open = useStreetImageryViewerOpen()
  const { showMarker } = useStreetImageryViewerActions()
  const { mainMap } = useMap()
  const query = useStreetImageryPhoto(photoRef, open)
  // The photo the viewer shows now: stepping along the sequence changes it.
  const [viewed, setViewed] = useState<NormalizedPhoto | null>(null)
  // Zoom and pan inside that photo: the links open the same view.
  const [view, setView] = useState<PhotoView | null>(null)
  const photo = query.data
  const shown = viewed ?? photo
  const label = STREET_IMAGERY_PROVIDER_LABEL[photoRef.provider]
  const notFound = query.error instanceof StreetImageryPhotoNotFoundError
  // Stepping along the sequence moves on from the photo that was opened.
  const pageUrl = shown ? providerExternalLink(shown, view) : streetImageryPhotoPageUrl(photoRef)
  const panelTopRef = useRef<HTMLDivElement>(null)
  const lng = shown?.lngLat[0]
  const lat = shown?.lngLat[1]
  const shownId = shown?.photoId
  const map = mainMap?.getMap()

  // A pin marks the place of the photo on screen, and the map keeps it in view: on phones in the
  // free part above the panel, on desktop anywhere.
  useEffect(
    function followPhoto() {
      const panelTop = isDesktopLayout()
        ? window.innerHeight
        : panelTopRef.current?.getBoundingClientRect().top
      if (!open || !map || panelTop == null) return
      if (lng == null || lat == null || shownId == null) return
      showMarker({ provider: photoRef.provider, id: shownId, lng, lat })
      keepInViewAbovePanel(map, { lng, lat }, panelTop)
    },
    [open, map, lng, lat, shownId, photoRef.provider, showMarker],
  )

  /** For a note: the link to the photo on screen, and the way back to where notes are written. */
  function copyLink() {
    navigator.clipboard.writeText(pageUrl).then(
      () => {
        toast('Link to this photo copied', {
          action: { label: 'Back to review', onClick: onBackToReview },
        })
      },
      () => {
        toast.error('The browser did not allow copying the link')
      },
    )
  }

  return (
    <div className="flex flex-col">
      <div
        ref={panelTopRef}
        className={clsx(
          'flex items-center justify-between gap-2 px-4 py-1.5',
          dragHandle && 'cursor-move touch-none select-none',
        )}
        {...dragHandle}
      >
        <Title className="sr-only">{label} photo</Title>
        <PhotoCredit provider={photoRef.provider} label={label} photo={shown} />
        <Button
          plain
          type="button"
          aria-label="Close"
          onClick={onDismiss}
          className="-mr-2 min-w-9"
        >
          <XMarkIcon />
        </Button>
      </div>

      {query.isLoading ? (
        <div
          role="status"
          className="my-8 flex items-center justify-center gap-2 text-sm/6 text-zinc-600"
        >
          <LoaderCircleIcon className="size-5 animate-spin text-zinc-400" aria-hidden />
          Loading photo…
        </div>
      ) : null}

      {query.isError ? (
        <div role="alert" className="mx-4 mb-4 rounded-lg bg-red-50 p-3 text-sm/6 text-red-800">
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

      <div className="relative">
        {photo ? (
          // The panels set their own 4:3 shape; the dialog sets the height instead, so a wide
          // dialog does not make the viewer taller than the screen.
          <div className="relative h-[min(56dvh,36rem)] overflow-hidden sm:h-[min(68dvh,44rem)] [&>div]:aspect-auto! [&>div]:h-full! [&>div]:rounded-none!">
            <StreetLevelImageryViewer
              photo={photo}
              groupPhotos={[]}
              onPhotoSelected={ignorePhotoSelection}
              onEaseMapToPoint={ignoreMapEase}
              onViewerPhoto={setViewed}
              onViewerView={setView}
              hideAttribution
            />
          </div>
        ) : null}
        {/* In the photo's corner from the width where they stay clear of the viewer's controls at
            its top centre; under the photo before that. */}
        <div className="flex gap-2 px-4 py-3 min-[56rem]:absolute min-[56rem]:top-2 min-[56rem]:left-2 min-[56rem]:z-10 min-[56rem]:p-0">
          <Button
            type="button"
            color="blue"
            disabled={!shown}
            onClick={copyLink}
            className={ACTION_BUTTON_CLASS_NAME}
          >
            <ClipboardIcon />
            Copy link
          </Button>
          <Button
            color="white"
            href={pageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={ACTION_BUTTON_CLASS_NAME}
          >
            <ArrowTopRightOnSquareIcon />
            <span className="min-[56rem]:hidden">{label}</span>
            <span className="max-[55.99rem]:hidden">Open on {label}</span>
          </Button>
        </div>
      </div>
      <div className="pb-[env(safe-area-inset-bottom)]" />
    </div>
  )
}

/**
 * The dialog of `StreetImageryDialog`, in its own chunk with the viewer. A bottom sheet on phones
 * (the Catalyst dialog sits at the bottom there) that leaves the top of the map free and undimmed,
 * so that the photo's place shows. On desktop a window that can be moved and leaves the map usable.
 */
export default function StreetImageryDialogContent() {
  const photo = useStreetImageryViewerPhoto()
  const open = useStreetImageryViewerOpen()
  const { close, clearMarker } = useStreetImageryViewerActions()
  const sheetBeforeRef = useRef<SheetPosition | null>(null)
  const desktop = useDesktopLayout()
  const { style, dragHandle } = useDraggableWindow()

  useEffect(
    function clearTheMapOnPhones() {
      if (!open || isDesktopLayout()) return
      sheetBeforeRef.current = getReviewSheetPosition()
      moveReviewSheet('map')
    },
    [open],
  )

  /** Leaves the photo for `sheet`. The pin only marks its place while it is open. */
  function leaveTo(sheet: SheetPosition | null) {
    close()
    clearMarker()
    if (sheet && !isDesktopLayout()) moveReviewSheet(sheet)
  }

  function onDismiss() {
    leaveTo(sheetBeforeRef.current)
  }

  // The window leaves the page usable, so Esc is not a modal's. It must not reach the review keys.
  useEffect(
    function closeWindowOnEscape() {
      if (!desktop || !open) return
      function closeOnEscape(event: KeyboardEvent) {
        if (event.key !== 'Escape' || document.querySelector('[role="dialog"], [role="menu"]'))
          return
        event.preventDefault()
        close()
        clearMarker()
      }
      document.addEventListener('keydown', closeOnEscape, { capture: true })
      return function stopClosingOnEscape() {
        document.removeEventListener('keydown', closeOnEscape, { capture: true })
      }
    },
    [desktop, open, close, clearMarker],
  )

  if (desktop) {
    if (!open || !photo) return null
    return (
      <section
        data-draggable-window
        aria-label="Street-level photo"
        style={style}
        className={`fixed z-50 max-h-[85dvh] w-[min(64rem,calc(100vw-4rem))] overflow-y-auto rounded-2xl bg-white shadow-lg ring-1 ring-zinc-950/10 ${WINDOW_FRAME_CLASS_NAME}`}
      >
        <PhotoBody
          key={`${photo.provider}/${photo.id}`}
          photoRef={photo}
          onDismiss={onDismiss}
          onBackToReview={() => leaveTo('list')}
          Title={WindowTitle}
          dragHandle={dragHandle}
        />
      </section>
    )
  }

  return (
    <Dialog
      open={open}
      onClose={onDismiss}
      size="5xl"
      backdropClassName="max-sm:bg-transparent"
      className={clsx(
        'relative max-h-[74dvh] overflow-y-auto [--gutter:0px]! sm:max-h-[85dvh]',
        DIALOG_FRAME_CLASS_NAME,
      )}
    >
      {photo ? (
        <PhotoBody
          key={`${photo.provider}/${photo.id}`}
          photoRef={photo}
          onDismiss={onDismiss}
          onBackToReview={() => leaveTo('list')}
          Title={DialogTitle}
        />
      ) : null}
    </Dialog>
  )
}
