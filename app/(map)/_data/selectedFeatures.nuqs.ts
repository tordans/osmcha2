import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs'

export type TSelectedFeatures = {
  selectedFeatures: null | string[]
  actions: { setSelectedFeatures: (feature: null | string[]) => void }
}

const useSelectedFeatures = () => {
  const [selectedFeatures, set] = useQueryState('feature', parseAsArrayOf(parseAsString))

  const setSelectedFeatures = (features: typeof selectedFeatures) => {
    // First click: Add
    // Second click: Replace or Remove (when same feature was clicked)
    set((prevFeatures) => {
      if (!prevFeatures || !prevFeatures.length) return features
      const newFeatures = prevFeatures?.filter((prevFeature) => !features?.includes(prevFeature))
      return newFeatures.length ? newFeatures : null
    })
  }

  return { selectedFeatures, actions: { setSelectedFeatures } }
}

export const useSelectedFeaturesFeatures = () => useSelectedFeatures().selectedFeatures

export const useSelectedFeaturesActions = () => useSelectedFeatures().actions
