import { Avatar } from '@components/core/avatar'
import {
  Sidebar,
  SidebarBody,
  SidebarHeader,
  SidebarItem,
  SidebarSection,
  SidebarSpacer,
} from '@components/core/sidebar'
import { FunnelIcon, PlusIcon, UserIcon } from '@heroicons/react/16/solid'
import { InformationCircleIcon } from '@heroicons/react/20/solid'

export const NavigationSidebar = () => {
  // TODO: Fetch Userdata, use avatar logo instead of <UserIcon/>
  // Use https://osmcha.org/api/v1/users/ user.avatar
  // const { osmChaUser } = await fetchUserData(osmChaChangeset.properties.uid)

  return (
    <Sidebar>
      <SidebarBody>
        <SidebarSection>
          <SidebarHeader>
            <FunnelIcon className="size-4" />
            <span>Changesets</span>
          </SidebarHeader>
          <SidebarItem href="/">Recent</SidebarItem>
          {/* TODO: Change uids to current user */}
          {/* TODO: Click does not fetch new data */}
          <SidebarItem href={`/?filters={"uids":[{"label":"11881","value":"11881"}]}`}>
            My Changesets
          </SidebarItem>
          {/* TODO: Change uids to current user */}
          {/* TODO: Click does not fetch new data */}
          <SidebarItem href={`/?filters={"checked_by":[{"label":"tordans","value":"tordans"}]}`}>
            My Reviews
          </SidebarItem>
          <SidebarSpacer />
          <SidebarItem href="/?aoi=3ee95214-1a8e-4a7e-8546-5c9c0ac2b006">Wrangelkiez</SidebarItem>
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
            {/* <Avatar src={PngLogo} square /> */}
            <Avatar icon={<UserIcon className="size-4" />} square /> <span>About</span>
          </SidebarHeader>
          <SidebarItem href="/user">Edit Account</SidebarItem>
          <SidebarItem href="/teams">Edit Teams</SidebarItem>
          <SidebarItem href="/watchlist">Trusted User</SidebarItem>
          <SidebarItem>Sign out</SidebarItem>
        </SidebarSection>
      </SidebarBody>
    </Sidebar>
  )
}
