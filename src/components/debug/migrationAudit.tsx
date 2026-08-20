import clsx from 'clsx'
import type { ReactNode } from 'react'

/** Temporary visual audit: leftover panels. Remove with the panels. */
const migrationDuplicateClass = 'rounded-md bg-red-100 ring-1 ring-inset ring-red-300'
const migrationMissingClass = 'rounded-md bg-purple-100 ring-1 ring-inset ring-purple-300'

export function MigrationAuditLegend() {
  return (
    <p className="mb-2 flex flex-wrap gap-1.5 text-[11px]/4 text-zinc-700">
      <span className={clsx('px-1.5 py-0.5', migrationDuplicateClass)}>Red: already elsewhere</span>
      <span className={clsx('px-1.5 py-0.5', migrationMissingClass)}>
        Purple: still unique — move
      </span>
    </p>
  )
}

export function MigrationAudit({
  kind,
  className,
  children,
}: {
  kind: 'duplicate' | 'missing'
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={clsx(
        'p-1',
        kind === 'duplicate' ? migrationDuplicateClass : migrationMissingClass,
        className,
      )}
    >
      {children}
    </div>
  )
}
