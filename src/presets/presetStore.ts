// Loads the preset data when the first row asks for it, and tells subscribers when it is there. Nothing
// here runs at import time: the data (about 32 KB gzip) is its own chunk, and the country borders
// (about 235 KB gzip, `locations.ts`) are a second one that only objects with a regional preset load.
import type { PresetMatcher } from './matcher.ts'
import type { LocationMatcher, LocationSet, LonLat, PresetRecord } from './types.ts'

export type PresetStoreState = {
  /** Undefined until the preset data is loaded. */
  matcher: PresetMatcher | undefined
  /** True once the country borders are loaded, so that `matcher.match` can be given a location. */
  locationsReady: boolean
}

let state: PresetStoreState = { matcher: undefined, locationsReady: false }
const listeners = new Set<() => void>()
let locations: LocationMatcher | undefined
let matcherRequested = false
let locationsRequested = false

// The matcher is made before the borders are there; it asks this, which answers once they are loaded.
// Nobody passes a location before `locationsReady`, so the answer is never wrong while they are missing.
const lateLocations: LocationMatcher = {
  matchesLocation(set: LocationSet | undefined, loc: LonLat) {
    return locations?.matchesLocation(set, loc) ?? false
  },
}

function setState(next: PresetStoreState) {
  state = next
  for (const listener of listeners) listener()
}

export function subscribePresets(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getPresetState() {
  return state
}

/** Starts loading the preset data, once. */
export function requestPresetMatcher() {
  if (matcherRequested) return
  matcherRequested = true
  Promise.all([import('./matcher.ts'), import('./data/matching-presets.json')])
    .then(([{ createPresetMatcher }, { default: records }]) => {
      setState({
        ...state,
        matcher: createPresetMatcher(records as PresetRecord[], lateLocations),
      })
    })
    .catch((error: unknown) => {
      console.error('Could not load the preset data', error)
    })
}

/** Starts loading the country borders, once. Only objects whose preset depends on the place ask for it. */
export function requestLocations() {
  if (locationsRequested) return
  locationsRequested = true
  import('./locations.ts')
    .then(({ createLocationMatcher }) => {
      locations = createLocationMatcher()
      setState({ ...state, locationsReady: true })
    })
    .catch((error: unknown) => {
      console.error('Could not load the country borders', error)
    })
}
