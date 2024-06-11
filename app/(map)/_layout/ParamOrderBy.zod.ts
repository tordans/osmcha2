import { z } from 'zod'

export const orderByOptions = [
  { value: 'date', label: 'Ascending Date' },
  { value: 'check_date', label: 'Ascending check date' },
  { value: 'create', label: 'Ascending object created' },
  { value: 'modify', label: 'Ascending object modified' },
  { value: 'delete', label: 'Ascending object deleted' },
  { value: 'comments_count', label: 'Ascending number of comments' },
  { value: '-date', label: 'Descending Date' },
  { value: '-check_date', label: 'Descending check date' },
  { value: '-create', label: 'Descending object created' },
  { value: '-modify', label: 'Descending object modified' },
  { value: '-delete', label: 'Descending object deleted' },
  { value: '-comments_count', label: 'Descending number of comments' },
]

export const ParamOrderBy = z
  .enum([
    'date',
    'check_date',
    'create',
    'modify',
    'delete',
    'comments_count',
    '-date',
    '-check_date',
    '-create',
    '-modify',
    '-delete',
    '-comments_count',
  ])
  .nullable()
