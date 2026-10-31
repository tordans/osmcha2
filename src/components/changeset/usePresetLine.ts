import { createContext, useContext, useEffect, useSyncExternalStore } from 'react'
import {
  getPresetState,
  requestLocations,
  requestPresetMatcher,
  subscribePresets,
} from '../../presets/presetStore.ts'
import type { ElementChange } from './changesetElements.ts'
import {
  presetContextOf,
  presetLineOf,
  presetsOfChange,
  type ChangePresets,
  type PresetContext,
} from './elementPresets.ts'

/** The way membership of the adiff, for the rows. Provided once per list, stable per adiff. */
export const PresetContextValue = createContext<PresetContext>(presetContextOf())

function useLoadPresetData(needsMatcher: boolean, needsLocations: boolean) {
  useEffect(
    function loadPresetData() {
      if (needsMatcher) requestPresetMatcher()
      if (needsLocations) requestLocations()
    },
    [needsMatcher, needsLocations],
  )
}

/**
 * The line under an object's title: the name of its preset, or undefined while the preset data (or the
 * country borders a regional preset needs) is not loaded, and when the preset is only a fallback.
 * `enabled` false (compact rows, rows that do not show it) does not match and does not load anything.
 */
export function usePresetLine(change: ElementChange, enabled: boolean) {
  const context = useContext(PresetContextValue)
  const { matcher, locationsReady } = useSyncExternalStore(subscribePresets, getPresetState)
  const presets: ChangePresets | undefined =
    enabled && matcher ? presetsOfChange(change, context, matcher, locationsReady) : undefined
  useLoadPresetData(enabled && !matcher, presets?.status === 'pending')

  return matcher && presets ? presetLineOf(presets, matcher.isFallback) : undefined
}

/**
 * The preset line that all members of a group share, or undefined when they differ or are not known.
 * The group shows it once and its rows leave it out.
 */
export function useSharedPresetLine(changes: readonly ElementChange[]) {
  const context = useContext(PresetContextValue)
  const { matcher, locationsReady } = useSyncExternalStore(subscribePresets, getPresetState)
  const presets = matcher
    ? changes.map((change) => presetsOfChange(change, context, matcher, locationsReady))
    : []
  useLoadPresetData(
    !matcher,
    presets.some(({ status }) => status === 'pending'),
  )

  const lines = matcher ? presets.map((item) => presetLineOf(item, matcher.isFallback)) : []
  const [first] = lines
  return first !== undefined && lines.every((line) => line === first) ? first : undefined
}
