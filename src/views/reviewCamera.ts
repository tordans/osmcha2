import type { SheetPosition } from '../components/changeset/reviewSheetSnap.ts'
import { isDesktopLayout } from '../layout/useDesktopLayout.ts'
import {
  getReviewSheetActions,
  getReviewSheetInsets,
  getReviewSheetPosition,
} from '../stores/review-sheet-store.ts'
import { createPendingCamera } from './pendingCamera.ts'

/** A camera move; `bottomInset` is how many px of the map the phone sheet covers. */
type ReviewCameraMove = (bottomInset: number) => void

const pendingCamera = createPendingCamera<ReviewCameraMove>()

/**
 * Run a review camera move now, or, while the phone sheet covers the whole map, keep it
 * until the map shows again. Desktop always moves at once.
 */
export function runReviewCamera(move: ReviewCameraMove) {
  if (isDesktopLayout()) {
    move(0)
    return
  }
  const position = getReviewSheetPosition()
  if (position === 'list') {
    pendingCamera.defer(move)
    return
  }
  move(getReviewSheetInsets()[position])
}

/** Move the phone sheet. Revealing the map runs the kept camera move as the sheet starts down. */
export function moveReviewSheet(next: SheetPosition) {
  const previous = getReviewSheetPosition()
  getReviewSheetActions().setPosition(next)
  if (previous === 'list' && next !== 'list') {
    pendingCamera.take()?.(getReviewSheetInsets()[next])
  }
}

/** Back to the list stop with nothing kept; for leaving a changeset. */
export function resetReviewSheet() {
  pendingCamera.clear()
  getReviewSheetActions().reset()
}
