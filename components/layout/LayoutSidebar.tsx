import {
  Sidebar,
  SidebarBody,
  SidebarHeader,
  SidebarItem,
  SidebarSection,
} from '@components/core/sidebar'
import { FunnelIcon, PlusIcon } from '@heroicons/react/16/solid'

export const LayoutSidebar = () => {
  return (
    <Sidebar>
      <SidebarHeader className="text-center">
        <h1 className="text-3xl font-normal text-zinc-500">
          <span className="text-blue-500">OSM</span>Cha
        </h1>
      </SidebarHeader>
      <SidebarBody>
        <SidebarSection>
          <SidebarItem href="/">Changesets</SidebarItem>
          <SidebarHeader>Filter</SidebarHeader>
          <SidebarItem href="/">
            <FunnelIcon />
            <span>My Changesets</span>
          </SidebarItem>
          <SidebarItem href="/">
            <FunnelIcon />
            <span>My Reviews</span>
          </SidebarItem>
          <SidebarItem href="/saved-filters">
            <PlusIcon />
            <span>Filter hinzufügen</span>
          </SidebarItem>
          <SidebarHeader>About</SidebarHeader>
          <SidebarItem href="/about">About</SidebarItem>
        </SidebarSection>
      </SidebarBody>
    </Sidebar>
  )
}
