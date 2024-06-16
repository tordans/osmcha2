import { create } from 'zustand'

export type THighlightedFeatures = {
  highlightedFeatures: null | string[]
  actions: { setHighlightedFeatures: (feature: null | string[]) => void }
}

const useHighlightedFeatures = create<THighlightedFeatures>()((set) => ({
  highlightedFeatures: null,
  actions: {
    setHighlightedFeatures: (features) =>
      set(() => {
        return { highlightedFeatures: features }
      }),
  },
}))

export const useHighlightedFeaturesFeatures = () =>
  useHighlightedFeatures((state) => state.highlightedFeatures)

export const useHighlightedFeaturesActions = () => useHighlightedFeatures((state) => state.actions)
