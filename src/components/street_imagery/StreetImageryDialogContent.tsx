import {
  AGE_BAND_COLORS,
  ageBand,
  providerExternalLink,
  type NormalizedPhoto,
  type PhotoView,
} from '@osm-editor-kit/street-imagery'
import {
  getViewpointSession,
  useCanGoBack,
  useCanGoForward,
} from '@osm-editor-kit/street-imagery-react'
import { StreetLevelImageryViewer } from '@osm-editor-kit/street-imagery-react/viewer'
import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState, type HTMLAttributes, type RefObject } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { toast } from 'sonner'
import mapillaryIconUrl from '../../assets/mapillary-icon.svg'
import { isDesktopLayout, useDesktopLayout } from '../../layout/useDesktopLayout.ts'
import { getReviewSheetPosition } from '../../stores/review-sheet-store.ts'
import { useEffectiveStreetImageryDate } from '../../stores/street-imagery-layer-store.ts'
import {
  getStreetImageryViewerActions,
  getStreetImageryViewerState,
  useStreetImageryPlacePhotos,
  useStreetImageryViewerActions,
  useStreetImageryViewerOpen,
  useStreetImageryViewerPhoto,
} from '../../stores/street-imagery-viewer-store.ts'
import { moveReviewSheet } from '../../views/reviewCamera.ts'
import { keepInViewAbovePanel } from '../../views/temporaryPinCamera.ts'
import type { SheetPosition } from '../changeset/reviewSheetSnap.ts'
import { RelativeTime } from '../relative_time.tsx'
import { Button } from '../ui/button.tsx'
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardIcon,
  LoaderCircleIcon,
  XMarkIcon,
} from '../ui/icons.ts'
import { useDraggableWindow } from '../ui/useDraggableWindow.ts'
import { photoAgeCutoff } from './streetImageryLayerSettings.ts'
import {
  fetchStreetImageryPhoto,
  StreetImageryPhotoNotFoundError,
  streetImageryPhotoPageUrl,
} from './streetImageryPhoto.ts'
import { StreetImageryPhotoSheet } from './StreetImageryPhotoSheet.tsx'
import { configureStreetImagery } from './streetImageryRuntime.ts'
import { STREET_IMAGERY_PROVIDER_LABEL, type StreetImageryRef } from './streetImageryTags.ts'

configureStreetImagery()

/**
 * A white frame on top of the photo, inset into the window: the photo itself keeps square corners,
 * so it meets the header in a straight line and only the frame rounds the window.
 */
const WINDOW_FRAME_CLASS_NAME =
  "after:pointer-events-none after:absolute after:inset-0 after:z-20 after:rounded-2xl after:ring-2 after:ring-white after:content-[''] after:ring-inset"

/** Over a photo: only the icon until the width that has room for the words. */
const ICON_BUTTON_CLASS_NAME = 'whitespace-nowrap max-[55.99rem]:size-11 max-[55.99rem]:p-0'
const BUTTON_LABEL_CLASS_NAME = 'max-[55.99rem]:hidden'

const SHEET_ENTER_TRANSITION = { type: 'spring', visualDuration: 0.35, bounce: 0 } as const

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
  const date = useEffectiveStreetImageryDate()
  const [now] = useState(() => Date.now())
  // The same rating as the colours on the map; what is too old only shows here, the map filters it.
  const band =
    photo?.capturedAt != null ? ageBand(photo.capturedAt, photoAgeCutoff(date, now), now) : null

  return (
    // div, not p: RelativeTime's tooltip renders a div.
    <div className="flex min-w-0 items-center gap-x-1.5 text-sm/6 whitespace-nowrap text-zinc-700">
      {provider === 'mapillary' ? (
        <img src={mapillaryIconUrl} alt="Mapillary" className="size-3.5 shrink-0" />
      ) : (
        <span className="font-medium">{label}</span>
      )}
      {photo?.capturedAt != null ? (
        <span
          className={clsx(
            'inline-flex items-center gap-1.5',
            band === 'outdated' && 'font-medium text-red-700',
          )}
        >
          {band ? (
            <span
              aria-hidden
              className="size-2 rounded-full"
              style={{ backgroundColor: AGE_BAND_COLORS[band] }}
            />
          ) : null}
          <span>
            <RelativeTime datetime={new Date(photo.capturedAt)} addSuffix={false} /> old
          </span>
        </span>
      ) : null}
      {photo?.creatorName ? <span className="truncate">by {photo.creatorName}</span> : null}
      {photo?.isPano == null ? null : (
        <span className="text-zinc-500">{photo.isPano ? '360°' : 'Flat'}</span>
      )}
      {provider === 'mapillary' ? <span className="text-zinc-500">CC BY-SA</span> : null}
    </div>
  )
}

/** Through the photos of a place when the viewer shows one, else through the photos opened. */
function movePhoto(offset: -1 | 1) {
  const { photo, placePhotos } = getStreetImageryViewerState()
  const { showPhoto } = getStreetImageryViewerActions()
  if (placePhotos) {
    const next = placePhotos[placePhotos.findIndex(({ id }) => id === photo?.id) + offset]
    if (next) showPhoto({ provider: next.provider, id: next.id })
    return
  }
  const { back, forward } = getViewpointSession().actions
  const entry = offset < 0 ? back() : forward()
  if (entry) {
    // History only holds photos that this dialog showed, so of the providers it knows.
    const provider = entry.photo.providerId as StreetImageryRef['provider']
    showPhoto({ provider, id: entry.photo.photoId })
  }
}

function goBack() {
  movePhoto(-1)
}

function goForward() {
  movePhoto(1)
}

function PhotoBody({
  photoRef,
  onDismiss,
  onBackToReview,
  dragHandle,
  headerRef,
  panelTop,
  settledMini,
}: {
  photoRef: StreetImageryRef
  onDismiss: () => void
  onBackToReview: () => void
  /** The header moves the desktop window or the phone sheet. */
  dragHandle?: HTMLAttributes<HTMLDivElement>
  headerRef?: RefObject<HTMLDivElement | null>
  /** On phones: where the sheet starts on screen. */
  panelTop?: () => number | null
  /** On phones: the sheet has stopped small. */
  settledMini?: boolean
}) {
  const open = useStreetImageryViewerOpen()
  const { setShownPhoto } = useStreetImageryViewerActions()
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
  const historyHasBack = useCanGoBack()
  const historyHasForward = useCanGoForward()
  const placePhotos = useStreetImageryPlacePhotos()
  const placeIndex = placePhotos?.findIndex(({ id }) => id === photoRef.id) ?? -1
  const canGoBack = placePhotos ? placeIndex > 0 : historyHasBack
  const canGoForward = placePhotos ? placeIndex < placePhotos.length - 1 : historyHasForward
  const map = mainMap?.getMap()

  // Every photo shown goes into the package's history; going back to one only moves through it.
  useEffect(
    function rememberPhoto() {
      if (open && shown)
        getViewpointSession().actions.showPhoto({ photo: shown, directionKey: null })
    },
    [open, shown],
  )

  // The map marks the photo on screen and keeps it in view: on phones in the free part above the
  // panel, on desktop anywhere.
  useEffect(
    function followPhoto() {
      if (!open || !shown) return
      setShownPhoto(shown)
      const top = isDesktopLayout() ? window.innerHeight : panelTop?.()
      if (!map || top == null) return
      const [lng, lat] = shown.lngLat
      keepInViewAbovePanel(map, { lng, lat }, top)
    },
    // `settledMini`: the free part changes with the sheet.
    [open, map, shown, panelTop, settledMini, setShownPhoto],
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
        ref={headerRef}
        className={clsx(
          'flex flex-col px-4 min-[56rem]:flex-row min-[56rem]:items-center min-[56rem]:justify-between min-[56rem]:gap-2 min-[56rem]:py-1.5',
          dragHandle && 'cursor-move touch-none select-none',
        )}
        {...dragHandle}
      >
        <h2 className="sr-only">{label} photo</h2>
        <PhotoCredit provider={photoRef.provider} label={label} photo={shown} />
        <div className="-mr-2 flex shrink-0 items-center justify-end gap-0.5">
          {placePhotos ? (
            <span
              className="mr-1 text-sm/6 text-zinc-500 tabular-nums"
              title="Photos looking at this place"
            >
              {placeIndex + 1} / {placePhotos.length}
            </span>
          ) : null}
          <Button
            plain
            type="button"
            aria-label="Previous photo"
            title="Previous photo ([)"
            disabled={!canGoBack}
            onClick={goBack}
            className="min-w-11 min-[56rem]:min-w-9"
          >
            <ArrowLeftIcon />
          </Button>
          <Button
            plain
            type="button"
            aria-label="Next photo"
            title="Next photo (])"
            disabled={!canGoForward}
            onClick={goForward}
            className="min-w-11 min-[56rem]:min-w-9"
          >
            <ArrowRightIcon />
          </Button>
          <Button
            plain
            type="button"
            aria-label="Close"
            onClick={onDismiss}
            className="min-w-11 min-[56rem]:min-w-9"
          >
            <XMarkIcon />
          </Button>
        </div>
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
          <div className="street-photo-viewer relative h-[min(56dvh,36rem)] overflow-hidden sm:h-[min(68dvh,44rem)] [&>div]:aspect-auto! [&>div]:h-full! [&>div]:rounded-none!">
            <StreetLevelImageryViewer
              photo={photo}
              groupPhotos={[]}
              onPhotoSelected={ignorePhotoSelection}
              onEaseMapToPoint={ignoreMapEase}
              onViewerPhoto={setViewed}
              onViewerView={setView}
              lookAtBearing={placePhotos?.[placeIndex]?.bearing}
              hideAttribution
            />
          </div>
        ) : null}
        {/* In the photo's corner, clear of the viewer's own controls; below what stands in for
            the photo when it did not load. */}
        <div className={clsx('flex gap-2', photo ? 'absolute top-2 left-2 z-10' : 'px-4 py-3')}>
          <Button
            type="button"
            color="blue"
            aria-label="Copy link"
            disabled={!shown}
            onClick={copyLink}
            className={clsx(photo && ICON_BUTTON_CLASS_NAME)}
          >
            <ClipboardIcon />
            <span className={clsx(photo && BUTTON_LABEL_CLASS_NAME)}>Copy link</span>
          </Button>
          <Button
            color="white"
            href={pageUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open on ${label}`}
            className={clsx(photo && ICON_BUTTON_CLASS_NAME)}
          >
            <ArrowTopRightOnSquareIcon />
            <span className={clsx(photo && BUTTON_LABEL_CLASS_NAME)}>Open on {label}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * The viewer of `StreetImageryDialog`, in its own chunk with the viewer. A bottom sheet on phones
 * that can go small, so that the photo's place shows. On desktop a window that can be moved. Both
 * leave the map usable.
 */
export default function StreetImageryDialogContent() {
  const photo = useStreetImageryViewerPhoto()
  const open = useStreetImageryViewerOpen()
  const { close } = useStreetImageryViewerActions()
  const sheetBeforeRef = useRef<SheetPosition | null>(null)
  const desktop = useDesktopLayout()
  const { style, dragHandle } = useDraggableWindow()
  const reduceMotion = useReducedMotion()

  useEffect(
    function clearTheMapOnPhones() {
      if (!open || isDesktopLayout()) return
      sheetBeforeRef.current = getReviewSheetPosition()
      moveReviewSheet('map')
    },
    [open],
  )

  /** Leaves the photo for `sheet`. */
  function leaveTo(sheet: SheetPosition | null) {
    close()
    if (sheet && !isDesktopLayout()) moveReviewSheet(sheet)
  }

  function onDismiss() {
    leaveTo(sheetBeforeRef.current)
  }

  useEffect(
    function forgetHistoryWhenClosed() {
      if (!open) getViewpointSession().actions.reset()
    },
    [open],
  )

  // The window leaves the page usable, so these keys are not a modal's. Esc must not reach the
  // review keys.
  useEffect(
    function handleWindowKeys() {
      if (!open) return
      function onKeyDown(event: KeyboardEvent) {
        if (document.querySelector('[role="dialog"], [role="menu"]')) return
        if (event.key === 'Escape') {
          event.preventDefault()
          close()
          return
        }
        if (event.target instanceof Element && event.target.closest('input, textarea')) return
        if (event.key === '[') goBack()
        if (event.key === ']') goForward()
      }
      document.addEventListener('keydown', onKeyDown, { capture: true })
      return function stopHandlingWindowKeys() {
        document.removeEventListener('keydown', onKeyDown, { capture: true })
      }
    },
    [open, close],
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
          dragHandle={dragHandle}
        />
      </section>
    )
  }

  return (
    <AnimatePresence>
      {open && photo ? (
        <motion.div
          key="photo-sheet"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={reduceMotion ? { duration: 0 } : SHEET_ENTER_TRANSITION}
          className="fixed inset-x-0 bottom-0 z-50"
        >
          <StreetImageryPhotoSheet>
            {({ headerRef, startDrag, panelTop, settledMini }) => (
              <PhotoBody
                key={`${photo.provider}/${photo.id}`}
                photoRef={photo}
                onDismiss={onDismiss}
                onBackToReview={() => leaveTo('list')}
                dragHandle={{ onPointerDown: startDrag }}
                headerRef={headerRef}
                panelTop={panelTop}
                settledMini={settledMini}
              />
            )}
          </StreetImageryPhotoSheet>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
