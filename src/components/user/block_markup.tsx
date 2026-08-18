import type { ReactNode } from 'react'

export function BlockMarkup({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-zinc-50 p-4 ring-1 ring-zinc-950/5">
      {children}
    </div>
  )
}
