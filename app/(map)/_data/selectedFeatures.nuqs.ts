import { memoize } from 'lodash'
import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs'

const memoized = memoize(
  (data) => data,
  ({ selectedFeatures }) => JSON.stringify(selectedFeatures),
)

export type TSelectedFeatures = {
  selectedFeatures: null | string[]
  setSelectedFeatures: (feature: null | string[]) => void
}

export const useSelectedFeatures = () => {
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

  return memoized({ selectedFeatures, setSelectedFeatures })
  // return { selectedFeatures, setSelectedFeatures }
}
