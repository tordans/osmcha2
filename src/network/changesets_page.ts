import { z } from 'zod'
import { PAGE_SIZE } from '../config/constants.ts'
import { appendDefaultDate, serializeFiltersToQuery } from '../utils/filters.ts'
import { changesetFeatureSchema } from './changeset.ts'
import { api } from './request.ts'

export const changesetsPageSchema = z.object({
  type: z.string().optional(),
  count: z.number(),
  next: z.string().nullable().optional(),
  previous: z.string().nullable().optional(),
  features: z.array(changesetFeatureSchema),
})

export type ChangesetsPage = z.infer<typeof changesetsPageSchema>

export function fetchChangesetsPage(
  pageIndex: number,
  filters: unknown = {},
  aoiId: string | null,
  nocache?: boolean,
): Promise<ChangesetsPage> {
  filters = appendDefaultDate(filters)
  const flatFilters = serializeFiltersToQuery(filters)

  const pageParams = nocache
    ? `page_size=${PAGE_SIZE}&page=${pageIndex + 1}`
    : `page=${pageIndex + 1}&page_size=${PAGE_SIZE}`

  const endpoint = aoiId
    ? `/aoi/${aoiId}/changesets/?${pageParams}`
    : `/changesets/?${pageParams}${flatFilters}`

  return api.get(endpoint).then((data) => changesetsPageSchema.parse(data))
}
