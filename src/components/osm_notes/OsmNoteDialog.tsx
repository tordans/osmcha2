import { useMap } from 'react-map-gl/maplibre'
import {
  OsmNoteUnavailableError,
  type OsmNote,
  type OsmNoteComment,
} from '../../network/osmNotes.ts'
import { osmNoteUrl } from '../../notes/osmNoteRefs.ts'
import { useOsmNote } from '../../query/hooks/useOsmNote.ts'
import {
  useOsmNoteActions,
  useOsmNoteId,
  useOsmNoteMarker,
  useOsmNoteOpen,
} from '../../stores/osm-note-store.ts'
import { formatLocalDateTime } from '../../utils/datetime.ts'
import { showOsmNoteOnMap } from '../../views/osmNoteCamera.ts'
import { RelativeTime } from '../relative_time.tsx'
import { LinkifyText } from '../text/LinkifyText.tsx'
import { Badge } from '../ui/badge.tsx'
import { Button } from '../ui/button.tsx'
import { Dialog, DialogTitle } from '../ui/dialog.tsx'
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  LoaderCircleIcon,
  MapPinIcon,
  XMarkIcon,
} from '../ui/icons.ts'

const STATUS_BADGE = {
  open: { color: 'green', label: 'Open' },
  closed: { color: 'zinc', label: 'Closed' },
  hidden: { color: 'red', label: 'Hidden' },
} as const

const ACTION_LABEL: Record<OsmNoteComment['action'], string> = {
  opened: 'opened the note',
  commented: 'commented',
  closed: 'closed the note',
  reopened: 'reopened the note',
  hidden: 'hid the note',
}

function isHttpUrl(value: string | null) {
  return value != null && /^https?:\/\//i.test(value)
}

function ExactDate({ iso }: { iso: string }) {
  return <span className="text-zinc-500">({formatLocalDateTime(new Date(iso))})</span>
}

function NoteThread({ comments }: { comments: OsmNoteComment[] }) {
  return (
    <ol className="mt-5 flex flex-col gap-4 border-t border-zinc-950/10 pt-4">
      {comments.map((comment) => (
        <li key={`${comment.date}-${comment.action}-${comment.user ?? ''}`} className="min-w-0">
          <p className="flex flex-wrap items-baseline gap-x-1.5 text-sm/6">
            <span className="font-semibold text-zinc-950">
              {comment.user ? (
                isHttpUrl(comment.userUrl) ? (
                  <a
                    href={comment.userUrl ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {comment.user}
                  </a>
                ) : (
                  comment.user
                )
              ) : (
                'Anonymous'
              )}
            </span>
            <span className="text-zinc-600">{ACTION_LABEL[comment.action]}</span>
            <span className="text-zinc-500">
              <RelativeTime datetime={new Date(comment.date)} />
            </span>
          </p>
          {comment.text ? (
            <p className="mt-1 text-base/6 wrap-break-word text-zinc-950 sm:text-sm/6">
              <LinkifyText text={comment.text} nl2br />
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  )
}

function NoteSummary({ note }: { note: OsmNote }) {
  const status = STATUS_BADGE[note.status]
  return (
    <div className="mt-2 flex flex-col gap-1 text-sm/6 text-zinc-700">
      <p className="flex flex-wrap items-center gap-x-2">
        <Badge color={status.color}>{status.label}</Badge>
        <span>
          Created <RelativeTime datetime={new Date(note.createdAt)} />
        </span>
        <ExactDate iso={note.createdAt} />
      </p>
      {note.closedAt ? (
        <p className="flex flex-wrap items-center gap-x-2">
          <span>
            Closed <RelativeTime datetime={new Date(note.closedAt)} />
          </span>
          <ExactDate iso={note.closedAt} />
        </p>
      ) : null}
    </div>
  )
}

/**
 * Quick view of an OSM map note, opened from a note reference in the changeset comment.
 * A bottom sheet on phones (the Catalyst dialog sits at the bottom there), a centred dialog
 * from `sm`. The note is fetched only while the dialog is open.
 */
export function OsmNoteDialog() {
  const noteId = useOsmNoteId()
  const open = useOsmNoteOpen()
  const marker = useOsmNoteMarker()
  const { close, clearMarker } = useOsmNoteActions()
  const { mainMap } = useMap()
  const query = useOsmNote(noteId, open)
  const note = query.data

  function showOnMap() {
    const map = mainMap?.getMap()
    if (!note || !map) return
    close()
    showOsmNoteOnMap(map, { id: note.id, lat: note.lat, lng: note.lng })
  }

  const markerShown = marker != null && marker.id === noteId
  const unavailable = query.error instanceof OsmNoteUnavailableError ? query.error : null

  return (
    <Dialog
      open={open}
      onClose={close}
      size="lg"
      className="max-h-[85dvh] overflow-y-auto [--gutter:--spacing(5)]! sm:[--gutter:--spacing(6)]!"
    >
      <div className="flex items-start justify-between gap-3">
        <DialogTitle>Note #{noteId}</DialogTitle>
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

      {note ? <NoteSummary note={note} /> : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          color="blue"
          disabled={!note || !mainMap}
          onClick={showOnMap}
          className="w-full sm:w-auto"
        >
          <MapPinIcon />
          Show on map
        </Button>
        {markerShown ? (
          <Button type="button" outline onClick={clearMarker} className="w-full sm:w-auto">
            Hide map marker
          </Button>
        ) : null}
        {noteId != null ? (
          <Button
            outline
            href={osmNoteUrl(noteId)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto"
          >
            <ArrowTopRightOnSquareIcon />
            Open on openstreetmap.org
          </Button>
        ) : null}
      </div>

      {query.isLoading ? (
        <div
          role="status"
          className="mt-8 mb-4 flex items-center justify-center gap-2 text-sm/6 text-zinc-600"
        >
          <LoaderCircleIcon className="size-5 animate-spin text-zinc-400" aria-hidden />
          Loading note…
        </div>
      ) : null}

      {query.isError ? (
        <div role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm/6 text-red-800">
          <p>
            {unavailable
              ? unavailable.message
              : 'The note could not be loaded from openstreetmap.org.'}
          </p>
          {unavailable ? null : (
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

      {note ? <NoteThread comments={note.comments} /> : null}
      <div className="pb-[env(safe-area-inset-bottom)]" />
    </Dialog>
  )
}
