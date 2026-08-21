import { useQuery } from '@tanstack/react-query'
import { fetchReasons, tagListSchema } from '../../network/reasons_tags.ts'
import { api } from '../../network/request.ts'
import { cacheOneHour } from '../cachePolicy.ts'

/** Options for the Filters form multi-selects (`suspicion-reasons`, `tags`). */
export function useFilterAsyncOptions(
  dataURL: string | undefined,
  token: string | null,
  teamMode: boolean,
) {
  return useQuery({
    queryKey: ['filter-options', dataURL, teamMode, Boolean(token)],
    queryFn: async () => {
      if (!dataURL) return []

      if (dataURL === 'suspicion-reasons') {
        const reasons = await fetchReasons()
        return reasons.map((reason) => ({
          label: reason.name,
          value: reason.id,
        }))
      }

      const endpoint = teamMode ? '/tags/' : '/tags/?page_size=200'
      const json = await api.get(endpoint)
      const rows = tagListSchema.parse(json).results ?? []
      if (teamMode) {
        return rows.map((row) =>
          row.trusted
            ? { label: `${row.name} (verified)`, value: row.name }
            : { label: row.name.replace('(verified)', ''), value: row.name },
        )
      }
      return rows
        .filter((row) => row.for_changeset)
        .map((row) => ({ label: row.name, value: row.id }))
    },
    enabled: Boolean(dataURL),
    ...cacheOneHour,
  })
}
