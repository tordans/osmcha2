import { useQuery } from '@tanstack/react-query'
import { useListPaneVisible } from '../../layout/useListPaneVisible.ts'
import { useAuthToken } from '../../stores/auth-store.ts'
import { changesetsPageQueryOptions, type ChangesetsPageParams } from '../options/changesetsPage.ts'

export function useChangesetsPage(params: ChangesetsPageParams) {
  const token = useAuthToken()
  const listVisible = useListPaneVisible()

  return useQuery({
    ...changesetsPageQueryOptions(params),
    enabled: !!token && listVisible,
  })
}
