import { lazy, Suspense } from 'react'
import { useStreetImageryViewerPhoto } from '../../stores/street-imagery-viewer-store.ts'

// The viewer, `mapillary-js` and the street-imagery package load with the first photo that opens,
// not with the changeset page.
const StreetImageryDialogContent = lazy(() => import('./StreetImageryDialogContent.tsx'))

/**
 * Quick view of a street-level photo (Mapillary, Panoramax), opened from a tag row or from the
 * photo layer on the map. Render once per changeset page; it renders nothing until a photo has
 * been opened.
 */
export function StreetImageryDialog() {
  const photo = useStreetImageryViewerPhoto()
  if (photo == null) return null
  return (
    <Suspense fallback={null}>
      <StreetImageryDialogContent />
    </Suspense>
  )
}
