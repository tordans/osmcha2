import { useMatch } from '@tanstack/react-router'
import clsx from 'clsx'
import type { ReactNode } from 'react'
import { TailwindResponsiveHelper } from '../components/debug/TailwindResponsiveHelper.tsx'
import { usePaneLayoutStore } from '../stores/paneLayoutStore.ts'
import { ChangesetsList } from '../views/changesets_list.tsx'
import { BackToListButton } from './BackToListButton.tsx'
import { ChromeHeader } from './NavigationFlyout.tsx'
import { paneCardClassName } from './paneCard.ts'
import { PaneResizeHandle } from './PaneResizeHandle.tsx'
import { LIST_MAX, LIST_MIN, resizeSidePane } from './paneWidths.ts'
import { useFullBleedLock } from './useFullBleedLock.ts'
import { PaneAvailableContext, usePaneLayout } from './usePaneLayout.ts'

export function AppShell({ children }: { children: ReactNode }) {
  const listHomeMatch = useMatch({ from: '/', shouldThrow: false })
  const changesetMatch = useMatch({ from: '/changesets/$id', shouldThrow: false })
  const listHome = Boolean(listHomeMatch)
  const changeset = Boolean(changesetMatch)
  const fullBleed = listHome || changeset
  const hasReview = changeset

  const { rowRef, available, displayed, paneVars } = usePaneLayout(hasReview)
  const resetListWidth = usePaneLayoutStore((state) => state.resetListWidth)

  useFullBleedLock(fullBleed)

  return (
    <div
      className={clsx(
        'flex min-w-0 flex-col font-sans',
        fullBleed ? 'h-[var(--app-height,100dvh)] overflow-hidden overscroll-none' : 'min-h-dvh',
        'min-[56rem]:bg-zinc-100 min-[56rem]:p-2',
      )}
      style={paneVars}
    >
      <PaneAvailableContext.Provider value={available}>
        <div
          ref={rowRef}
          className={clsx(
            'flex min-h-0 min-w-0 flex-1 flex-col min-[56rem]:flex-row',
            fullBleed && 'h-full',
          )}
        >
          <aside
            className={clsx(
              '@container/list min-h-0 min-w-0 flex-col',
              listHome ? 'flex h-full' : 'hidden',
              'min-[56rem]:flex min-[56rem]:w-(--pane-list-width,18rem) min-[56rem]:shrink-0',
              fullBleed
                ? 'min-[56rem]:h-full'
                : 'min-[56rem]:sticky min-[56rem]:top-2 min-[56rem]:h-[calc(var(--app-height,100dvh)-1rem)]',
            )}
          >
            <ChromeHeader />
            <div
              className={clsx('flex min-h-0 flex-1 flex-col overflow-hidden', paneCardClassName)}
            >
              <ChangesetsList />
            </div>
          </aside>

          <PaneResizeHandle
            aria-label="Resize list pane"
            value={displayed.list}
            min={LIST_MIN}
            max={LIST_MAX}
            onDragDelta={(delta) => {
              const { listWidth, reviewWidth, setListWidth } = usePaneLayoutStore.getState()
              setListWidth(
                resizeSidePane({
                  side: 'list',
                  delta,
                  available,
                  list: listWidth,
                  review: reviewWidth,
                  hasReview,
                }),
              )
            }}
            onReset={resetListWidth}
          />

          <main
            className={clsx(
              'relative min-h-0 min-w-0 flex-1 flex-col',
              listHome ? 'hidden min-[56rem]:flex' : 'flex',
              fullBleed
                ? 'h-full overflow-hidden'
                : 'min-h-dvh overflow-x-hidden overflow-y-auto min-[56rem]:min-h-0',
              !changeset && paneCardClassName,
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
      </PaneAvailableContext.Provider>
      <TailwindResponsiveHelper />
    </div>
  )
}
