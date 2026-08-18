import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/16/solid'
import { TableHeader } from './ui/table.tsx'

type SortHeaderProps = {
  label: string
  sorted: false | 'asc' | 'desc'
  onSort: () => void
  className?: string
}

export function SortHeader({ label, sorted, onSort, className }: SortHeaderProps) {
  return (
    <TableHeader
      aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none'}
      className={className}
    >
      <button
        type="button"
        className="inline-flex min-h-11 cursor-pointer touch-manipulation items-center gap-1 select-none"
        onClick={() => onSort()}
      >
        {label}
        {sorted === 'asc' ? (
          <ChevronUpIcon className="size-4" />
        ) : sorted === 'desc' ? (
          <ChevronDownIcon className="size-4" />
        ) : null}
      </button>
    </TableHeader>
  )
}
