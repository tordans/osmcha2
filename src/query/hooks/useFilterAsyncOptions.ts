import { useQuery } from '@tanstack/react-query'
import { API_URL } from '../../config/index.ts'
import { fetchReasons } from '../../network/reasons_tags.ts'
import { cacheOneHour } from '../cachePolicy.ts'

type ReasonRow = {
  id: string | number
  name: string
}

type TagRow = {
  id: string | number
  name: string
  for_changeset?: boolean
  trusted?: boolean
}

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
        const reasons = (await fetchReasons()) as ReasonRow[]
        return reasons.map((reason) => ({
          label: reason.name,
          value: reason.id,
        }))
      }

      const response = await fetch(
        teamMode ? `${API_URL}/${dataURL}/` : `${API_URL}/${dataURL}/?page_size=200`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Token ${token}` : '',
          },
        },
      )
      const json = (await response.json()) as { results?: TagRow[] }
      const rows = json.results ?? []
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
