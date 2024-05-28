import { Avatar } from '@components/core/avatar'
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from '@components/core/dropdown'
import { NavbarItem } from '@components/core/navbar'
import {
  ArrowRightStartOnRectangleIcon,
  Cog8ToothIcon,
  ListBulletIcon,
  UserIcon,
  UsersIcon,
} from '@heroicons/react/16/solid'

export const LayoutUserProfileDropdown = () => {
  return (
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
  )
}
