import { create } from 'zustand'

interface ChangesetNotesStore {
  discussionRaw: boolean
  actions: {
    setDiscussionRaw: (value: boolean) => void
  }
}

const useChangesetNotesStore = create<ChangesetNotesStore>()((set) => ({
  discussionRaw: false,
  actions: {
    setDiscussionRaw: (value) =>
      set((state) => (state.discussionRaw === value ? state : { discussionRaw: value })),
  },
}))

export const useDiscussionRaw = () => useChangesetNotesStore((state) => state.discussionRaw)

export const useChangesetNotesActions = () => useChangesetNotesStore((state) => state.actions)
