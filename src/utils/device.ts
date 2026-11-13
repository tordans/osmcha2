/**
 * How the person works: `keyboard` with a fine pointer (mouse, trackpad, pen), which comes with a
 * keyboard on a desktop; `touch` when fingers are the only pointer (a phone, a tablet without a
 * trackpad). Detected once before the first render and kept on <html> as `data-input`, so that
 * texts and the `touch:` / `keyboard:` Tailwind variants follow one signal.
 *
 * `?device=touch` or `?device=keyboard` in the address overrides it, to see a phone's texts on a
 * desktop.
 */
export type DeviceInput = 'keyboard' | 'touch'

export type DeviceSignals = {
  /** `matchMedia('(any-pointer: fine)').matches`: a mouse, trackpad or pen is connected */
  finePointer?: boolean
  /** `navigator.maxTouchPoints` */
  maxTouchPoints?: number
  /** `location.search` */
  search?: string
}

/**
 * The input from the browser's signals. An iPad with a trackpad and a laptop with a touch screen
 * count as `keyboard`; an iPad without a trackpad, even one that calls itself a Mac, as `touch`.
 */
export function detectInput(signals: DeviceSignals): DeviceInput {
  const override = new URLSearchParams(signals.search ?? '').get('device')?.toLowerCase()
  if (override === 'touch' || override === 'keyboard') return override
  const fine = signals.finePointer ?? (signals.maxTouchPoints ?? 0) === 0
  return fine ? 'keyboard' : 'touch'
}

function readInput(): DeviceInput {
  if (typeof window === 'undefined') return 'keyboard'
  return detectInput({
    finePointer:
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(any-pointer: fine)').matches
        : undefined,
    maxTouchPoints: navigator.maxTouchPoints,
    search: window.location.search,
  })
}

/** Sets `data-input` on <html>. Called once, before the first render (index.tsx). */
export function initDeviceInput(root = document.documentElement): DeviceInput {
  const input = readInput()
  root.dataset.input = input
  return input
}

/** The device's input, as set before the first render. */
export function deviceInput(): DeviceInput {
  if (typeof document !== 'undefined') {
    const value = document.documentElement.dataset.input
    if (value === 'touch' || value === 'keyboard') return value
  }
  return readInput()
}
