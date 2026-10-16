import { create } from 'zustand'

interface DiscussionLayoutStore {
  discussionRaw: boolean
  actions: {
    setDiscussionRaw: (value: boolean) => void
  }
}

const useDiscussionLayoutStore = create<DiscussionLayoutStore>()((set) => ({
  discussionRaw: false,
  actions: {
    setDiscussionRaw: (value) =>
      set((state) => (state.discussionRaw === value ? state : { discussionRaw: value })),
  },
}))

export const useDiscussionRaw = () => useDiscussionLayoutStore((state) => state.discussionRaw)

export const useDiscussionLayoutActions = () => useDiscussionLayoutStore((state) => state.actions)
