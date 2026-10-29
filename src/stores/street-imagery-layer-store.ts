import type { DateRange } from '@osm-editor-kit/street-imagery'
import { z } from 'zod'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  DEFAULT_PHOTO_DATE,
  STREET_IMAGERY_PHOTO_KINDS,
  type StreetImageryPhotoKind,
} from '../components/street_imagery/streetImageryLayerSettings.ts'
import type { StreetImageryProvider } from '../components/street_imagery/streetImageryTags.ts'

const day = z.iso.date()

/** Read field by field: a stored value that does not fit is dropped and its default is used. */
const persistedSchema = z.object({
  mapillary: z.boolean().catch(false),
  panoramax: z.boolean().catch(false),
  photoKind: z.enum(STREET_IMAGERY_PHOTO_KINDS).catch('all'),
  date: z
    .object({ from: day.optional().catch(undefined), to: day.optional().catch(undefined) })
    .nullable()
    .catch(null),
})

type Persisted = z.infer<typeof persistedSchema>

interface StreetImageryLayerStore extends Persisted {
  actions: {
    setProviderOn: (provider: StreetImageryProvider, on: boolean) => void
    setPhotoKind: (kind: StreetImageryPhotoKind) => void
    /** `null` goes back to the default (the last two years). `{}` shows all dates. */
    setDate: (date: DateRange | null) => void
  }
}

/** The settings of a stored value; a missing or broken one becomes the defaults. Never throws. */
export function parsePersistedStreetImageryLayer(value: unknown): Persisted {
  const parsed = persistedSchema.safeParse(value)
  return parsed.success ? parsed.data : persistedSchema.parse({})
}

const useStreetImageryLayerStore = create<StreetImageryLayerStore>()(
  persist(
    (set, get) => ({
      // Both providers are off until someone switches one on: nothing is requested before that.
      ...parsePersistedStreetImageryLayer(undefined),
      actions: {
        setProviderOn: (provider, on) => {
          if (get()[provider] !== on) set({ [provider]: on })
        },
        setPhotoKind: (photoKind) => {
          if (get().photoKind !== photoKind) set({ photoKind })
        },
        setDate: (date) => set({ date }),
      },
    }),
    {
      name: 'street-imagery-layer',
      partialize: ({ mapillary, panoramax, photoKind, date }) => ({
        mapillary,
        panoramax,
        photoKind,
        date,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...parsePersistedStreetImageryLayer(persistedState),
      }),
    },
  ),
)

export const useMapillaryLayerOn = () => useStreetImageryLayerStore((state) => state.mapillary)

export const usePanoramaxLayerOn = () => useStreetImageryLayerStore((state) => state.panoramax)

/** At least one provider is on: the layer is on. */
export const useStreetImageryLayerOn = () =>
  useStreetImageryLayerStore((state) => state.mapillary || state.panoramax)

export const useStreetImageryPhotoKind = () =>
  useStreetImageryLayerStore((state) => state.photoKind)

/** The chosen range; `null` while the default applies. */
export const useStreetImageryDate = () => useStreetImageryLayerStore((state) => state.date)

/** The range the layer filters by: the chosen one, else the default. */
export const useEffectiveStreetImageryDate = () =>
  useStreetImageryLayerStore((state) => state.date ?? DEFAULT_PHOTO_DATE)

export const useStreetImageryLayerActions = () =>
  useStreetImageryLayerStore((state) => state.actions)

export function getStreetImageryLayerActions() {
  return useStreetImageryLayerStore.getState().actions
}

export function getStreetImageryLayerState() {
  const { mapillary, panoramax, photoKind, date } = useStreetImageryLayerStore.getState()
  return { mapillary, panoramax, photoKind, date }
}
