import { useMatch } from '@tanstack/react-router'
import { useListPaneOpen } from '../stores/list-pane-store.ts'
import { useDesktopLayout } from './useDesktopLayout.ts'

/** True when the changeset list is on screen and should load its query. */
export function useListPaneVisible() {
  const open = useListPaneOpen()
  const desktop = useDesktopLayout()
  const listHome = Boolean(useMatch({ from: '/', shouldThrow: false }))
  return desktop ? open : listHome
}
