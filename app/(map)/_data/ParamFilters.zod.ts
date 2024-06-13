import { z } from 'zod'

const LabelValueString = z.object({ label: z.string(), value: z.string() })
const LabelValueBoolean = z.object({ label: z.string(), value: z.boolean() })

export type TParamFilters = z.infer<typeof ParamFilters>

export const ParamFilters = z.strictObject({
  uids: z.array(LabelValueString).optional(), // UserIDs
  users: z.array(LabelValueString).optional(),
  checked_by: z.array(LabelValueString).optional(),
  date__gte: z.array(LabelValueString).optional(),
  date__lte: z.array(LabelValueString).optional(),
  harmful: z.array(LabelValueBoolean).optional(),
  metadata: z.array(LabelValueString).optional(),
})

// My Changesets:
// 'https://osmcha.org/?filters={"uids":[{"label":"11881","value":"11881"}],"date__gte":[{"label":"","value":""}]}'
// QUERY: https://osmcha.org/api/v1/changesets/?page=1&page_size=25&uids=11881&date__lte=2024-06-11%2004%3A51

// QUERY:
// My Reviews:
// 'https://osmcha.org/?filters={"checked_by":[{"label":"tordans","value":"tordans"}],"date__gte":[{"label":"","value":""}]}
// QUERY: https://osmcha.org/api/v1/changesets/?page=1&page_size=25&checked_by=tordans&date__lte=2024-06-11%2004%3A51

// One user:
// 'https://osmcha.org/watchlist?filters={"users":[{"label":"tordans","value":"tordans"}]}'
// QUERY: https://osmcha.org/api/v1/changesets/?page=1&page_size=25&uids=11881&date__lte=2024-06-11%2004%3A48

// QUERY PARAM: order_by=modify, order_by=-check_date
