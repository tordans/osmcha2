import { create } from 'zustand'

type TFechtErrors = {
  osmChaRealChangesetError: undefined | string
  actions: { setOsmChaRealChangesetError: (message: string) => void }
}

const useFetchErrors = create<TFechtErrors>()((set) => ({
  osmChaRealChangesetError: undefined,
  actions: {
    setOsmChaRealChangesetError: (message) => set(() => ({ osmChaRealChangesetError: message })),
  },
}))

// TODO: Not used ATM, see app/(map)/changesets/[id]/_components/fetchPageData.ts

export const useOsmChaRealChangesetError = () =>
  useFetchErrors((state) => state.osmChaRealChangesetError)

export const useFetchErrorsActions = () => useFetchErrors((state) => state.actions)
