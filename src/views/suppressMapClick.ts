let suppressUntil = 0

/** Marker dragend often emits a map click; ignore that click. */
export function suppressNextMapClick() {
  suppressUntil = Date.now() + 400
}

export function shouldIgnoreMapClick() {
  return Date.now() < suppressUntil
}
