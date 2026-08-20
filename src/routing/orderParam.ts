/** URL `order=date,desc` ↔ Django API `order_by=-date`. */

const ORDER_FIELDS = ['date', 'check_date', 'create', 'modify', 'delete', 'comments_count'] as const

const ORDER_DIRECTIONS = ['asc', 'desc'] as const

type OrderField = (typeof ORDER_FIELDS)[number]
type OrderDirection = (typeof ORDER_DIRECTIONS)[number]
type OrderSearchValue = `${OrderField},${OrderDirection}`

const ORDER_FIELD_SET = new Set<string>(ORDER_FIELDS)
const ORDER_DIRECTION_SET = new Set<string>(ORDER_DIRECTIONS)

function isOrderField(value: string): value is OrderField {
  return ORDER_FIELD_SET.has(value)
}

function isOrderDirection(value: string): value is OrderDirection {
  return ORDER_DIRECTION_SET.has(value)
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
  if (typeof param !== 'string') return undefined
  const parts = param.split(',')
  if (parts.length !== 2) return undefined
  const [field, direction] = parts
  if (!isOrderField(field) || !isOrderDirection(direction)) return undefined
  return direction === 'desc' ? `-${field}` : field
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
  if (Array.isArray(value)) {
    const first = value[0]
    if (first && typeof first === 'object' && 'value' in first && typeof first.value === 'string') {
      return parseApiOrder(first.value) ? first.value : undefined
    }
  }
  return undefined
}
