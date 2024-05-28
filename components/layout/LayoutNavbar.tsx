import { Navbar, NavbarDivider, NavbarSection, NavbarSpacer } from '@components/core/navbar'
import { LayoutNavigationDesktop } from '@components/layout/LayoutNavigationDesktop'
import { LayoutUserProfileDropdown } from '@components/layout/LayoutUserProfileDropdown'

export const LayoutNavbar = () => {
  return (
    <Navbar>
      <h1 className="hidden select-none text-xl font-normal text-zinc-500 lg:block">
        <span className="text-blue-500">OSM</span>Cha
      </h1>
      <NavbarDivider className="max-lg:hidden" />
      <NavbarSection className="max-lg:hidden">
        <LayoutNavigationDesktop />
      </NavbarSection>
      <NavbarSpacer />
      <NavbarSection>
        <LayoutUserProfileDropdown />
      </NavbarSection>
    </Navbar>
  )
}
