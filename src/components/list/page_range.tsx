import { Button } from '../ui/button.tsx'
import { ChevronLeftIcon, ChevronRightIcon } from '../ui/icons.ts'

interface PageRangeProps {
  page: string | number
  pageIndex: number
  disabled?: boolean
  active: boolean
  getChangesetsPage: (pageIndex: number) => unknown
}

export function PageRange({
  page,
  pageIndex,
  disabled,
  active,
  getChangesetsPage,
}: PageRangeProps) {
  const label =
    typeof page === 'number'
      ? `Page ${page + 1}`
      : page === 'arrow-left'
        ? 'Previous page'
        : 'Next page'

  return (
    <Button
      {...(active ? { color: 'zinc' as const } : { plain: true as const })}
      disabled={disabled}
      onClick={() => getChangesetsPage(pageIndex)}
      className="min-h-11 min-w-11"
      aria-label={label}
      aria-current={active ? 'page' : undefined}
    >
      {typeof page === 'number' ? (
        page + 1
      ) : page === 'arrow-left' ? (
        <ChevronLeftIcon data-slot="icon" className="size-5" />
      ) : (
        <ChevronRightIcon data-slot="icon" className="size-5" />
      )}
    </Button>
  )
}
