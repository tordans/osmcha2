import { useMatch } from '@tanstack/react-router'
import clsx from 'clsx'
import type { ReactNode } from 'react'
import { TailwindResponsiveHelper } from '../components/debug/TailwindResponsiveHelper.tsx'
import { ChangesetsList } from '../views/changesets_list.tsx'
import { BackToListButton } from './BackToListButton.tsx'
import { ChromeHeader } from './NavigationFlyout.tsx'
import { useFullBleedLock } from './useFullBleedLock.ts'

const paneCard =
  'min-[56rem]:rounded-lg min-[56rem]:bg-white min-[56rem]:shadow-sm min-[56rem]:ring-1 min-[56rem]:ring-zinc-950/5'

export function AppShell({ children }: { children: ReactNode }) {
  const listHomeMatch = useMatch({ from: '/', shouldThrow: false })
  const changesetMatch = useMatch({ from: '/changesets/$id', shouldThrow: false })
  const listHome = Boolean(listHomeMatch)
  const changeset = Boolean(changesetMatch)
  const fullBleed = listHome || changeset

  useFullBleedLock(fullBleed)

  return (
    <div
      className={clsx(
        'flex min-w-0 flex-col font-sans',
        fullBleed ? 'h-[var(--app-height,100dvh)] overflow-hidden overscroll-none' : 'min-h-dvh',
        'min-[56rem]:bg-zinc-100 min-[56rem]:p-2',
      )}
    >
      <div
        className={clsx(
          'flex min-h-0 min-w-0 flex-1 flex-col min-[56rem]:flex-row min-[56rem]:gap-3',
          fullBleed && 'h-full',
        )}
      >
        <aside
          className={clsx(
            'min-h-0 min-w-0 flex-col',
            listHome ? 'flex h-full' : 'hidden',
            'min-[56rem]:flex min-[56rem]:w-72 min-[56rem]:shrink-0',
            fullBleed
              ? 'min-[56rem]:h-full'
              : 'min-[56rem]:sticky min-[56rem]:top-2 min-[56rem]:h-[calc(var(--app-height,100dvh)-1rem)]',
          )}
        >
          <ChromeHeader />
          <div className={clsx('flex min-h-0 flex-1 flex-col overflow-hidden', paneCard)}>
            <ChangesetsList />
          </div>
        </aside>

        <main
          className={clsx(
            'relative min-h-0 min-w-0 flex-1 flex-col',
            listHome ? 'hidden min-[56rem]:flex' : 'flex',
            fullBleed
              ? 'h-full overflow-hidden'
              : 'min-h-dvh overflow-x-hidden overflow-y-auto min-[56rem]:min-h-0',
            !changeset && paneCard,
          )}
        >
          {!fullBleed && (
            <div className="min-[56rem]:hidden">
              <ChromeHeader />
            </div>
          )}
          <div
            className={clsx(
              'min-h-0 min-w-0 flex-1',
              fullBleed &&
                'flex h-full min-h-0 flex-col overflow-hidden [&>*]:h-full [&>*]:min-h-0',
            )}
          >
            {children}
          </div>
          {changeset && <BackToListButton />}
        </main>
      </div>
      <TailwindResponsiveHelper />
    </div>
  )
}
