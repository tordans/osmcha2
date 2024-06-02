import { TOsmChaRealChangeset } from '@app/(map)/_components/Changeset/zod/OsmChaRealChangeset.zod'
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownHeading,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
} from '@components/core/dropdown'
import { ArrowTopRightOnSquareIcon, ChevronDownIcon } from '@heroicons/react/16/solid'

type Props = { element: TOsmChaRealChangeset['elements'][number] }

const urlElementOsm = (osmType: string, osmId: string | number) => {
  return `https://openstreetmap.org/${osmType}/${osmId}` as const
}
const urlElementDeephistory = (osmType: string, osmId: string | number) => {
  return `https://osmlab.github.io/osm-deep-history/#/${osmType}/${osmId}` as const
}
const urlElementPewu = (osmType: string, osmId: string | number) => {
  return `https://pewu.github.io/osm-history/#/${osmType}/${osmId}` as const
}

export const DetailsChangesOpenElement = ({ element }: Props) => {
  return (
    <Dropdown>
      <DropdownButton outline className="p-0">
        <ArrowTopRightOnSquareIcon className="size-4" />
        <ChevronDownIcon />
      </DropdownButton>
      <DropdownMenu anchor="left start">
        <DropdownItem href={urlElementOsm(element.type, element.id)} target="_blank">
          OSM Website
        </DropdownItem>
        <DropdownDivider />
        <DropdownSection>
          <DropdownHeading>History</DropdownHeading>
          <DropdownItem href={urlElementDeephistory(element.type, element.id)} target="_blank">
            Deep History
          </DropdownItem>
          <DropdownItem href={urlElementPewu(element.type, element.id)} target="_blank">
            PeWu
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
