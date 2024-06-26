import { fetchAois } from '@app/(map)/_data/fetchAois'
import { fetchUserData } from '@app/(map)/_data/fetchUserData'
import { auth } from '@app/_components/auth/nextAuth'
import { Avatar } from '@app/_components/core/avatar'
import {
  Sidebar,
  SidebarBody,
  SidebarHeader,
  SidebarItem,
  SidebarSection,
  SidebarSpacer,
} from '@app/_components/core/sidebar'
import { FunnelIcon, PlusIcon, UserIcon } from '@heroicons/react/16/solid'
import { InformationCircleIcon } from '@heroicons/react/20/solid'
import { NavigationItemLogout } from './NavigationItemLogout'

export const NavigationSidebar = async () => {
  const session = await auth()
  const currentUserId = session?.user?.id
  const { osmOrgUser } = await fetchUserData(currentUserId)
  const currentUserName = osmOrgUser?.user?.display_name
  const aois = await fetchAois()
  // console.log('NavigationSidebar', { session, osmOrgUser, aois })

  return (
    <Sidebar>
      <SidebarBody>
        <SidebarSection>
          <SidebarHeader>
            <FunnelIcon className="size-4" />
            <span>Changesets</span>
          </SidebarHeader>
          <SidebarItem href="/">Recent</SidebarItem>
          <SidebarItem
            href={`/?filters={"uids":[{"label":"${currentUserId}","value":"${currentUserId}"}]}`}
          >
            My Changesets
          </SidebarItem>
          <SidebarItem
            href={`/?filters={"checked_by":[{"label":"${currentUserName}","value":"${currentUserName}"}]}`}
          >
            My Reviews
          </SidebarItem>
          {aois.count && <SidebarSpacer />}
          {aois.results.features.map((aoi) => {
            return (
              <SidebarItem key={aoi.id} href={`/?aoi=${aoi.id}`}>
                {aoi.properties.name}
              </SidebarItem>
            )
          })}
          <SidebarSpacer />
          <SidebarItem href="/saved-filters">
            <PlusIcon className="size-4" />
            <span>Filter hinzufügen</span>
          </SidebarItem>
        </SidebarSection>

        <SidebarSection>
          <SidebarHeader>
            <InformationCircleIcon className="size-4" />
            <span>About</span>
          </SidebarHeader>
          <SidebarItem href="/about">About</SidebarItem>
        </SidebarSection>

        <SidebarSection>
          <SidebarHeader>
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-1">
                <UserIcon className="size-4" />
                Account
              </div>
              {osmOrgUser?.user?.img?.href && (
                <div className="flex items-center gap-1">
                  {currentUserName}
                  <Avatar src={osmOrgUser?.user?.img?.href} square className="size-6" />
                </div>
              )}
            </div>
          </SidebarHeader>
          <SidebarItem href="/user">Edit Account</SidebarItem>
          <SidebarItem href="/teams">Edit Teams</SidebarItem>
          <SidebarItem href="/watchlist">Trusted User</SidebarItem>
          <NavigationItemLogout />
        </SidebarSection>
      </SidebarBody>
    </Sidebar>
  )
}
