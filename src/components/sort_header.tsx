import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/16/solid'
import { TableHeader } from './ui/table.tsx'

type SortHeaderProps<K extends string> = {
  label: string
  sortKey: K
  active: K
  dir: 'asc' | 'desc'
  onSort: (key: K) => void
  className?: string
}

export function SortHeader<K extends string>({
  label,
  sortKey,
  active,
  dir,
  onSort,
  className,
}: SortHeaderProps<K>) {
  const isActive = active === sortKey

  return (
    <TableHeader
      aria-sort={isActive ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={className}
    >
      <button
        type="button"
        className="inline-flex min-h-11 cursor-pointer touch-manipulation items-center gap-1 select-none"
        onClick={() => onSort(sortKey)}
      >
        {label}
        {isActive ? (
          dir === 'asc' ? (
            <ChevronUpIcon className="size-4" />
          ) : (
            <ChevronDownIcon className="size-4" />
          )
        ) : null}
      </button>
    </TableHeader>
  )
}
