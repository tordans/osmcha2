import { TOsmChaChangeset } from '@app/(map)/_components/Changeset/zod/osmChaChangeset'
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

type Props = { changeset: TOsmChaChangeset }

const urlChangesetOsm = (changesetId: number) => {
  return `https://openstreetmap.org/changeset/${changesetId}` as const
}
const urlChangesetAchavi = (changesetId: number) => {
  return `https://overpass-api.de/achavi/?changeset=${changesetId}&relations=true` as const
}
const urlChangesetRevert = (changesetId: number) => {
  return `https://revert.monicz.dev/?changesets=${changesetId}` as const
}

export const HeaderOpenInButton = ({ changeset }: Props) => {
  return (
    <Dropdown>
      <DropdownButton outline className="p-0">
        Open
        <ChevronDownIcon />
      </DropdownButton>
      <DropdownMenu anchor="bottom start">
        <DropdownItem href={urlChangesetOsm(changeset.id)} target="_blank">
          openstreetmap.org
        </DropdownItem>
        <DropdownDivider />
        <DropdownSection>
          <DropdownHeading>Tools</DropdownHeading>
          <DropdownItem href={urlChangesetAchavi(changeset.id)} target="_blank">
            Achavi
          </DropdownItem>
          <DropdownItem href={urlChangesetRevert(changeset.id)} target="_blank">
            osm-revert
          </DropdownItem>
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
