import type { Map } from 'maplibre-gl'
import { isDesktopLayout } from '../layout/useDesktopLayout.ts'
import { getOsmNoteActions } from '../stores/osm-note-store.ts'
import { flyMapToPin } from './changesetCamera.ts'
import { moveReviewSheet, runReviewCamera } from './reviewCamera.ts'

type NotePosition = { id: number; lat: number; lng: number }

/**
 * Put a temporary marker on the note and fly the main map to it.
 * Desktop: fly at once. Phone: slide the review sheet down to the map stop first, then fly
 * with the part of the map the sheet still covers kept free, so the marker is not hidden.
 */
export function showOsmNoteOnMap(map: Map, note: NotePosition) {
  getOsmNoteActions().showMarker(note)
  if (!isDesktopLayout()) moveReviewSheet('map')
  runReviewCamera((bottomInset) => {
    flyMapToPin(map, { lat: note.lat, lng: note.lng }, { bottomInset })
  })
}
