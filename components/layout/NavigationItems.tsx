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
  return (
    <Sidebar>
      <SidebarHeader className="text-center">
        <h1 className="text-2xl font-normal text-zinc-500">
          <span className="text-blue-500">OSM</span>Cha
        </h1>
      </SidebarHeader>
      <SidebarBody>
        <SidebarSection>
          <SidebarHeader>
            <FunnelIcon />
            Changesets
          </SidebarHeader>
          <SidebarItem href="/">Recent</SidebarItem>
          <SidebarItem
            href={`?filters={"uids":[{"label":"11881","value":"11881"}],"date__gte":[{"label":"","value":""}]}`}
          >
            My Changesets
          </SidebarItem>
          <SidebarItem
            href={`filters={"checked_by":[{"label":"tordans","value":"tordans"}],"date__gte":[{"label":"","value":""}]}`}
          >
            My Reviews
          </SidebarItem>
          <SidebarSpacer />
          <SidebarItem href="/?aoi=3ee95214-1a8e-4a7e-8546-5c9c0ac2b006">Wrangelkiez</SidebarItem>
          <SidebarSpacer />
          <SidebarItem href="/saved-filters">
            <PlusIcon />
            <span>Filter hinzufügen</span>
          </SidebarItem>

          <SidebarHeader>
            <InformationCircleIcon />
            About
          </SidebarHeader>
          <SidebarItem href="/about">About</SidebarItem>

          <SidebarHeader>
            {/* <Avatar src={PngLogo} square /> */}
            <Avatar icon={<UserIcon className="size-5" />} square /> About
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
