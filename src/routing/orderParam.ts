/** URL `order=date,desc` ↔ Django API `order_by=-date`. */

import { z } from 'zod'

const ORDER_FIELDS = ['date', 'check_date', 'create', 'modify', 'delete', 'comments_count'] as const

const ORDER_DIRECTIONS = ['asc', 'desc'] as const

type OrderField = (typeof ORDER_FIELDS)[number]
type OrderDirection = (typeof ORDER_DIRECTIONS)[number]
type OrderSearchValue = `${OrderField},${OrderDirection}`

const orderFieldSchema = z.enum(ORDER_FIELDS)
const orderDirectionSchema = z.enum(ORDER_DIRECTIONS)
const orderFilterItemsSchema = z.array(z.object({ value: z.string() })).nonempty()

function isOrderField(value: string): value is OrderField {
  return orderFieldSchema.safeParse(value).success
}

/** Parse Django `order_by` (`date` / `-date`) into field + direction. */
export function parseApiOrder(
  value: string,
): { field: OrderField; direction: OrderDirection } | null {
  const desc = value.startsWith('-')
  const field = desc ? value.slice(1) : value
  if (!isOrderField(field)) return null
  return { field, direction: desc ? 'desc' : 'asc' }
}

/** `date,desc` → Django `order_by` value `-date`. */
export function searchParamToApiOrder(param: unknown): string | undefined {
  const paramResult = z.string().safeParse(param)
  if (!paramResult.success) return undefined
  const parts = paramResult.data.split(',')
  if (parts.length !== 2) return undefined
  const fieldResult = orderFieldSchema.safeParse(parts[0])
  const directionResult = orderDirectionSchema.safeParse(parts[1])
  if (!fieldResult.success || !directionResult.success) return undefined
  return directionResult.data === 'desc' ? `-${fieldResult.data}` : fieldResult.data
}

/** Django `order_by` value `-date` → URL `date,desc`. */
export function apiOrderToSearchParam(apiValue: string): OrderSearchValue | undefined {
  const parsed = parseApiOrder(apiValue)
  if (!parsed) return undefined
  return `${parsed.field},${parsed.direction}`
}

/** Pull a Django `order_by` value out of a URL param or `{label,value}` filter. */
export function apiOrderFromUnknown(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return parseApiOrder(value) ? value : undefined
  }
  const parsed = orderFilterItemsSchema.safeParse(value)
  if (parsed.success) {
    const apiValue = parsed.data[0].value
    return parseApiOrder(apiValue) ? apiValue : undefined
  }
  return undefined
}
