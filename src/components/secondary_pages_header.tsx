import type { ReactNode } from 'react'
import { Avatar } from './ui/avatar.tsx'
import { Heading } from './ui/heading.tsx'

export function AccountPage({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh px-[max(1.5rem,env(safe-area-inset-left))] pt-[max(1.5rem,env(safe-area-inset-top))] pr-[max(1.5rem,env(safe-area-inset-right))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">{children}</div>
    </div>
  )
}

export function SecondaryPagesHeader({ title, avatar }: { title: string; avatar?: string }) {
  return (
    <header className="flex min-h-11 items-center gap-3">
      {avatar ? <Avatar src={avatar} alt="" className="size-9" /> : null}
      <Heading>{title}</Heading>
    </header>
  )
}
