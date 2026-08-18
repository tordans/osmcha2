import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../stores/authStore.ts'
import {
  changesetsPageQueryOptions,
  type ChangesetsPageParams,
} from '../options/changesetsPage.ts'

export function useChangesetsPage(params: ChangesetsPageParams) {
  const token = useAuthStore((state) => state.token)

  return useQuery({
    ...changesetsPageQueryOptions(params),
    enabled: !!token,
  })
}
