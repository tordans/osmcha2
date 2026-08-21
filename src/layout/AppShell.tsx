import { useMatch } from '@tanstack/react-router'
import clsx from 'clsx'
import type { ReactNode } from 'react'
import { TailwindResponsiveHelper } from '../components/debug/TailwindResponsiveHelper.tsx'
import { useListPaneOpen } from '../stores/list-pane-store.ts'
import { usePaneLayoutStore } from '../stores/paneLayoutStore.ts'
import { ChangesetsList } from '../views/changesets_list.tsx'
import { BackToListButton } from './BackToListButton.tsx'
import { ChromeHeader, CollapsedListChrome } from './NavigationFlyout.tsx'
import { paneCardClassName, paneCardClipClassName } from './paneCard.ts'
import { PaneResizeHandle } from './PaneResizeHandle.tsx'
import { LIST_MAX, LIST_MIN, resizeSidePane } from './paneWidths.ts'
import { useDesktopLayout } from './useDesktopLayout.ts'
import { useFullBleedLock } from './useFullBleedLock.ts'
import { PaneAvailableContext, usePaneLayout } from './usePaneLayout.ts'

export function AppShell({ children }: { children: ReactNode }) {
  const listHomeMatch = useMatch({ from: '/', shouldThrow: false })
  const changesetMatch = useMatch({ from: '/changesets/$id', shouldThrow: false })
  const listHome = Boolean(listHomeMatch)
  const changeset = Boolean(changesetMatch)
  const fullBleed = listHome || changeset
  const hasReview = changeset
  const listOpen = useListPaneOpen()
  const desktop = useDesktopLayout()

  const { rowRef, available, displayed, paneVars } = usePaneLayout(hasReview)
  const resetListWidth = usePaneLayoutStore((state) => state.resetListWidth)

  useFullBleedLock(fullBleed)

  return (
    <div
      className={clsx(
        'flex min-w-0 flex-col font-sans',
        fullBleed ? 'h-[var(--app-height,100dvh)] overflow-hidden overscroll-none' : 'min-h-dvh',
        'min-[56rem]:bg-zinc-100 min-[56rem]:p-2.5',
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
          <div
            inert={desktop && !listOpen ? true : undefined}
            className={clsx(
              'min-h-0 min-w-0',
              listHome ? 'flex h-full flex-col' : 'hidden',
              'min-[56rem]:flex min-[56rem]:shrink-0 min-[56rem]:flex-col',
              fullBleed
                ? 'min-[56rem]:h-full'
                : 'min-[56rem]:sticky min-[56rem]:top-2.5 min-[56rem]:h-[calc(var(--app-height,100dvh)-1.25rem)]',
              listOpen ? 'min-[56rem]:w-(--pane-list-slot-width,18.625rem)' : 'min-[56rem]:w-0',
              'min-[56rem]:transition-[width] min-[56rem]:duration-200 min-[56rem]:ease-out',
              'motion-reduce:min-[56rem]:transition-none',
            )}
          >
            {/* Clip the slide without clipping the list card glow into the shell padding. */}
            <div
              className={clsx(
                'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden min-[56rem]:flex-row',
                listOpen &&
                  'min-[56rem]:-mb-2.5 min-[56rem]:-ml-2.5 min-[56rem]:h-[calc(100%+0.625rem)] min-[56rem]:w-[calc(100%+0.625rem)] min-[56rem]:pb-2.5 min-[56rem]:pl-2.5',
              )}
            >
              <aside
                id="changeset-list-pane"
                className={clsx(
                  '@container/list flex min-h-0 min-w-0 flex-1 flex-col',
                  'min-[56rem]:h-full min-[56rem]:w-(--pane-list-width,18rem) min-[56rem]:shrink-0 min-[56rem]:gap-2.5',
                )}
              >
                <ChromeHeader />
                <div className={clsx('relative z-0 flex min-h-0 flex-1 flex-col', paneCardClassName)}>
                  <div className={clsx('flex min-h-0 flex-1 flex-col', paneCardClipClassName)}>
                    <ChangesetsList />
                  </div>
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
                      hasList: true,
                    }),
                  )
                }}
                onReset={resetListWidth}
              />
            </div>
          </div>

          <main
            className={clsx(
              'relative min-h-0 min-w-0 flex-1 flex-col',
              listHome ? 'hidden min-[56rem]:flex' : 'flex',
              fullBleed
                ? 'h-full overflow-hidden min-[56rem]:overflow-visible'
                : 'min-h-dvh overflow-x-hidden overflow-y-auto min-[56rem]:min-h-0',
              !changeset && paneCardClassName,
            )}
          >
            {!listOpen && <CollapsedListChrome />}
            {!fullBleed && (
              <div className="min-[56rem]:hidden">
                <ChromeHeader />
              </div>
            )}
            <div
              className={clsx(
                'min-h-0 min-w-0 flex-1',
                fullBleed &&
                  'flex h-full min-h-0 flex-col overflow-hidden min-[56rem]:overflow-visible [&>*]:h-full [&>*]:min-h-0',
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
