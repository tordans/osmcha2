import { z } from 'zod'

export const ParamPage = z.coerce.number().optional()
