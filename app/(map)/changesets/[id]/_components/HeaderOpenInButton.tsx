import { TOsmChaChangeset } from '@app/(map)/_components/Changeset/zod/OsmChaChangeset.zod'
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
const urlUserOsm = (username: string) => {
  return `https://openstreetmap.org/user/${username}` as const
}
const urlUserHdyc = (username: string) => {
  return `https://hdyc.neis-one.org/?${username}` as const
}
const urlUserMissingmaps = (username: string) => {
  return `https://www.missingmaps.org/users/#/${username}` as const
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
          OSM Website
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
        <DropdownDivider />
        <DropdownSection>
          <DropdownHeading>User {changeset.properties.user}</DropdownHeading>
          <DropdownItem href={urlUserOsm(changeset.properties.user)} target="_blank">
            OSM Userprofil
          </DropdownItem>
          <DropdownItem href={urlUserHdyc(changeset.properties.user)} target="_blank">
            HDYC
          </DropdownItem>
          <DropdownItem href={urlUserMissingmaps(changeset.properties.user)} target="_blank">
            Missing Maps
          </DropdownItem>
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  )
}
