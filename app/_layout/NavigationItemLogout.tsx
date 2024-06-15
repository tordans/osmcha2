'use client'
import { signOut } from '../_components/auth/server-actions'
import { SidebarItem } from '../_components/core/sidebar'

export const NavigationItemLogout = () => {
  return (
    <SidebarItem
      onClick={async () => {
        await signOut()
        // await signIn()
      }}
    >
      Sign Out
    </SidebarItem>
  )
}
