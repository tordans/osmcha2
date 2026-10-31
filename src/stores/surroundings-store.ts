import { create } from 'zustand'

interface SurroundingsStore {
  visible: boolean
  actions: {
    setVisible: (visible: boolean) => void
  }
}

/** For this session, not per changeset: the data is not tied to a changeset either. */
const useSurroundingsStore = create<SurroundingsStore>()((set) => ({
  visible: true,
  actions: {
    setVisible: (visible) => set({ visible }),
  },
}))

export const useSurroundingsVisible = () => useSurroundingsStore((state) => state.visible)

export const useSurroundingsActions = () => useSurroundingsStore((state) => state.actions)
