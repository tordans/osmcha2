import { useQuery } from '@tanstack/react-query'
import { tagListSchema } from '../../network/reasons_tags.ts'
import { api } from '../../network/request.ts'
import { cacheForever } from '../cachePolicy.ts'

export function useChangesetTagOptions() {
  return useQuery({
    queryKey: ['tags', 'changeset-visible'],
    queryFn: async () => {
      const json = await api.get('/tags/')
      return (tagListSchema.parse(json).results ?? [])
        .filter((row) => row.is_visible && row.for_changeset)
        .map((row) => ({ label: row.name, value: Number(row.id) }))
    },
    ...cacheForever,
  })
}
