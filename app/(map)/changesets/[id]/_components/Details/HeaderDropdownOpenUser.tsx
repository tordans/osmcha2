import {
  Dropdown,
  DropdownButton,
  DropdownHeading,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
} from '@components/core/dropdown'
import { TOsmChaChangeset } from '@components/zod/OsmChaChangeset.zod'
import { ChevronDownIcon } from '@heroicons/react/16/solid'

type Props = { changeset: TOsmChaChangeset }

const urlUserOsm = (username: string) => {
  return `https://openstreetmap.org/user/${username}` as const
}
const urlUserHdyc = (username: string) => {
  return `https://hdyc.neis-one.org/?${username}` as const
}
const urlUserMissingmaps = (username: string) => {
  return `https://www.missingmaps.org/users/#/${username}` as const
}
const urlUserOsmCha = (username: string) => {
  // TODO Use typesafe query params
  return `https://osmcha.org/?filters={"users":[{"label":"${username}","value":"${username}"}],"date__gte":[{"label":"","value":""}]}` as const
}

export const DropdownOpenUser = ({ changeset }: Props) => {
  return (
    <Dropdown>
      <DropdownButton outline className="p-0">
        User
        <ChevronDownIcon />
      </DropdownButton>
      <DropdownMenu anchor="left start">
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
          <DropdownItem href={urlUserOsmCha(changeset.properties.user)} target="_blank">
            OSMCha
          </DropdownItem>
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  )
}
