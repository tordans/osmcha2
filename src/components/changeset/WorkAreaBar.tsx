import clsx from 'clsx'
import type { ReactNode } from 'react'
import type { ActiveWorkArea, WorkArea } from '../../views/changesetWorkAreas.ts'
import { Badge } from '../ui/badge.tsx'
import { flyoutFrostedSurfaceClassName } from '../ui/flyout.ts'
import type { WorkAreaChanges } from './workAreaChanges.ts'

/** Jump between the places a spread-out changeset touched. */
export function WorkAreaBar({
  groups,
  active,
  onJump,
}: {
  groups: WorkAreaChanges[]
  active: ActiveWorkArea
  onJump: (area: WorkArea | null) => void
}) {
  return (
    <nav
      aria-label="Work areas"
      className={clsx(
        'pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-lg p-1',
        flyoutFrostedSurfaceClassName,
      )}
    >
      <WorkAreaButton current={active === 'all'} onClick={() => onJump(null)}>
        All
      </WorkAreaButton>
      {groups.map(({ area, changes }) =>
        area ? (
          <WorkAreaButton key={area.id} current={active === area.id} onClick={() => onJump(area)}>
            Area {area.id}
            <Badge color={active === area.id ? 'blue' : 'zinc'}>{changes.length}</Badge>
          </WorkAreaButton>
        ) : null,
      )}
    </nav>
  )
}

function WorkAreaButton({
  current,
  onClick,
  children,
}: {
  current: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={current}
      onClick={onClick}
      className={clsx(
        'flex min-h-9 flex-none cursor-pointer touch-manipulation items-center gap-1.5 rounded-md px-2.5 text-sm font-medium whitespace-nowrap select-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
        current ? 'bg-blue-50 text-blue-700' : 'text-zinc-700 hover:bg-zinc-950/5',
      )}
    >
      {children}
    </button>
  )
}
