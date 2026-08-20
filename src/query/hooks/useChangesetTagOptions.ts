import { useQuery } from '@tanstack/react-query'
import { api } from '../../network/request.ts'
import { cacheForever } from '../cachePolicy.ts'

type TagRow = {
  id: number
  name: string
  is_visible?: boolean
  for_changeset?: boolean
}

export function useChangesetTagOptions() {
  return useQuery({
    queryKey: ['tags', 'changeset-visible'],
    queryFn: async () => {
      const json = await api.get<{ results?: TagRow[] }>('/tags/')
      return (json.results ?? [])
        .filter((row) => row.is_visible && row.for_changeset)
        .map((row) => ({ label: row.name, value: row.id }))
    },
    ...cacheForever,
  })
}
