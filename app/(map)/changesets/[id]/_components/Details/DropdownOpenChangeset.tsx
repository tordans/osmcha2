import { translateUrl } from '@app/(map)/_components/TranslateButton'
import { TOsmChaChangeset } from '@app/(map)/_data/OsmChaChangeset.zod'
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownHeading,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
} from '@app/_components/core/dropdown'
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

export const DropdownOpenChangeset = ({ changeset }: Props) => {
  return (
    <Dropdown>
      <DropdownButton outline className="p-0">
        Changeset
        <ChevronDownIcon />
      </DropdownButton>
      <DropdownMenu anchor="left start">
        <DropdownItem href={urlChangesetOsm(changeset.id)} target="_blank">
          OSM Website
        </DropdownItem>
        <DropdownItem
          href={translateUrl(changeset.properties.comment, changeset.properties.metadata?.locale)}
          target="_blank"
        >
          Translate Changeset Comment
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
          <DropdownItem href="/#Level9">Level0</DropdownItem>
          <DropdownItem href="/#Rapid">Rapid</DropdownItem>
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  )
}
