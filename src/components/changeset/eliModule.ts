import { useEffect, useSyncExternalStore } from 'react'

type EliModule = typeof import('@osm-editor-kit/maplibre-editor-layer-index')

/*
 * The Editor Layer Index bundles its layer list (about 80 KB gzip). It loads on its own, after the
 * changes list, and only when a changeset names its imagery or the backgrounds panel opens.
 */

let eli: EliModule | null = null
let loading: Promise<EliModule> | null = null
const listeners = new Set<() => void>()

export function loadEli(): Promise<EliModule> {
  loading ??= import('@osm-editor-kit/maplibre-editor-layer-index').then(
    (module) => {
      eli = module
      for (const listener of listeners) listener()
      return module
    },
    (error: unknown) => {
      loading = null
      throw error
    },
  )
  return loading
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return function unsubscribe() {
    listeners.delete(listener)
  }
}

function getEli() {
  return eli
}

/** The index once it has loaded, else null; starts the load while `enabled`. */
export function useEli(enabled = true): EliModule | null {
  const module = useSyncExternalStore(subscribe, getEli)
  useEffect(
    function loadEliWhenEnabled() {
      if (enabled) void loadEli()
    },
    [enabled],
  )
  return module
}
