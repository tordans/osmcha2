import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_BASEMAP_ID, isBuiltinBasemapId } from "../components/changeset/basemapStyles.ts";

interface MapState {
  style: string;
  setStyle: (style: string) => void;
}

export const useMapStore = create<MapState>()(
  persist(
    (set) => ({
      style: DEFAULT_BASEMAP_ID,
      setStyle: (style) => set({ style }),
    }),
    {
      name: "map-controls",
      partialize: (state) => ({
        style: isBuiltinBasemapId(state.style) ? state.style : DEFAULT_BASEMAP_ID,
      }),
    },
  ),
);
