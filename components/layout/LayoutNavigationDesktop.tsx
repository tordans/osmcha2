import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from '@components/core/dropdown'
import { NavbarItem } from '@components/core/navbar'
import { ChevronDownIcon, FunnelIcon, PlusIcon } from '@heroicons/react/16/solid'

export const LayoutNavigationDesktop = () => {
  return (
    <>
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
    </>
  )
}
