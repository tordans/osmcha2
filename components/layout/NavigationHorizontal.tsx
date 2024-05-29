import { Navbar, NavbarDivider, NavbarSection, NavbarSpacer } from '@components/core/navbar'
import { NavigationHorizontalUserProfileDropdown } from '@components/layout/NavigationHorizontalUserProfileDropdown'
import { NavigationHorizontalNavigationItems } from './NavigationHorizontalNavigationItems'

export const NavigationHorizontal = () => {
  return (
    <Navbar>
      <h1 className="hidden select-none text-xl font-normal text-zinc-500 lg:block">
        <span className="text-blue-500">OSM</span>Cha
      </h1>
      <NavbarDivider className="max-lg:hidden" />
      <NavbarSection className="max-lg:hidden">
        <NavigationHorizontalNavigationItems />
      </NavbarSection>
      <NavbarSpacer />
      <NavbarSection>
        <NavigationHorizontalUserProfileDropdown />
      </NavbarSection>
    </Navbar>
  )
}
