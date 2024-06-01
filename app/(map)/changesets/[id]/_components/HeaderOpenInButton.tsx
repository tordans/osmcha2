import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownHeading,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
} from '@components/core/dropdown'
import { ChevronDownIcon } from '@heroicons/react/16/solid'

type Props = { changeset: any }

export const HeaderOpenInButton = ({ changeset }: Props) => {
  return (
    <Dropdown>
      <DropdownButton outline className="p-0">
        Open
        <ChevronDownIcon />
      </DropdownButton>
      <DropdownMenu anchor="bottom start">
        <DropdownItem href="/#1">openstreetmap.org</DropdownItem>
        <DropdownDivider />
        <DropdownSection>
          <DropdownHeading>Tools</DropdownHeading>
          <DropdownItem href="/#achavi">Achavi</DropdownItem>
          <DropdownItem href="/#rever">osm-revert</DropdownItem>
        </DropdownSection>
        <DropdownDivider />
        <DropdownSection>
          <DropdownHeading>Editor</DropdownHeading>
          <DropdownItem href="/#id">iD</DropdownItem>
          <DropdownItem href="/#JOSM">JOSM</DropdownItem>
          <DropdownItem href="/#Level9">Levle0</DropdownItem>
          <DropdownItem href="/#Rapid">Rapid</DropdownItem>
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  )
}
