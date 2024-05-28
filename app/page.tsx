import { Avatar } from '@components/core/avatar'
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from '@components/core/dropdown'
import {
  Navbar,
  NavbarDivider,
  NavbarItem,
  NavbarSection,
  NavbarSpacer,
} from '@components/core/navbar'
import {
  Sidebar,
  SidebarBody,
  SidebarHeader,
  SidebarItem,
  SidebarSection,
} from '@components/core/sidebar'
import { StackedLayout } from '@components/core/stacked-layout'
import {
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
  Cog8ToothIcon,
  FunnelIcon,
  ListBulletIcon,
  PlusIcon,
  UserIcon,
  UsersIcon,
} from '@heroicons/react/16/solid'

export default function HomePage() {
  return (
    <StackedLayout
      navbar={
        <Navbar>
          <h1 className="hidden select-none text-xl font-normal text-zinc-500 lg:block">
            <span className="text-blue-500">OSM</span>Cha
          </h1>
          <NavbarDivider className="max-lg:hidden" />
          <NavbarSection className="max-lg:hidden">
            <NavbarItem href="/">Changesets</NavbarItem>
            <Dropdown>
              <DropdownButton as={NavbarItem}>
                Filter <ChevronDownIcon />
              </DropdownButton>
              <DropdownMenu className="min-w-64" anchor="bottom start">
                <DropdownItem href="/">
                  <FunnelIcon />
                  <DropdownLabel>My Changesets</DropdownLabel>
                </DropdownItem>
                <DropdownItem href="/">
                  <FunnelIcon />
                  <DropdownLabel>My Reviews</DropdownLabel>
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem href="/saved-filters">
                  <PlusIcon />
                  <DropdownLabel>Filter hinzufügen</DropdownLabel>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
            <NavbarItem href="/about">About</NavbarItem>
          </NavbarSection>
          <NavbarSpacer />
          <NavbarSection>
            <Dropdown>
              <DropdownButton as={NavbarItem}>
                {/* <Avatar src={PngLogo} square /> */}
                <Avatar icon={<UserIcon className="size-5" />} square />
              </DropdownButton>
              <DropdownMenu className="min-w-64" anchor="bottom end">
                <DropdownItem href="/user">
                  <Cog8ToothIcon />
                  <DropdownLabel>Edit Account</DropdownLabel>
                </DropdownItem>
                <DropdownItem href="/teams">
                  <UsersIcon />
                  <DropdownLabel>Edit Teams</DropdownLabel>
                </DropdownItem>
                <DropdownItem href="/watchlist">
                  <ListBulletIcon />
                  <DropdownLabel>Trusted User</DropdownLabel>
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem href="/logout">
                  <ArrowRightStartOnRectangleIcon />
                  <DropdownLabel>Sign out</DropdownLabel>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </NavbarSection>
        </Navbar>
      }
      sidebar={
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
      }
    >
      {/* {children} */}
    </StackedLayout>
  )
}
