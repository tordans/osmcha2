import { TOsmChaChangeset } from '@app/(map)/_data/OsmChaChangeset.zod'
import {
  Dropdown,
  DropdownButton,
  DropdownHeading,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
} from '@app/_components/core/dropdown'
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
const urlUserChangesetsByUserWithComments = (userId: string) => {
  return `http://resultmaps.neis-one.org/osm-discussion-comments?uid=${userId}` as const
}
const urlUserChangesetCommentsByUser = (userId: string) => {
  return `https://resultmaps.neis-one.org/osm-discussion-comments?uid=${userId}&commented` as const
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
        <DropdownSection>
          <DropdownHeading>Comments</DropdownHeading>
          <DropdownItem
            href={urlUserChangesetsByUserWithComments(changeset.properties.uid)}
            target="_blank"
          >
            Changesets by User with comments
          </DropdownItem>
          <DropdownItem
            href={urlUserChangesetCommentsByUser(changeset.properties.uid)}
            target="_blank"
          >
            Comments on Changesets by User
          </DropdownItem>
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  )
}
