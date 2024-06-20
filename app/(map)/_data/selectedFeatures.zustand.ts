// import { create } from 'zustand'

// export type TSelectedFeatures = {
//   selectedFeatures: null | string[]
//   actions: { setSelectedFeatures: (feature: null | string[]) => void }
// }

// const useSelectedFeatures = create<TSelectedFeatures>()((set) => ({
//   selectedFeatures: null,
//   actions: {
//     setSelectedFeatures: (features) =>
//       set(({ selectedFeatures: prevFeatures }) => {
//         if (!prevFeatures?.length) return { selectedFeatures: features }

//         const newFeatures = prevFeatures?.filter((prevFeature) => !features?.includes(prevFeature))
//         return { selectedFeatures: newFeatures.length ? newFeatures : null }
//       }),
//   },
// }))

// export const useSelectedFeaturesFeatures = () =>
//   useSelectedFeatures((state) => state.selectedFeatures)

// export const useSelectedFeaturesActions = () => useSelectedFeatures((state) => state.actions)
