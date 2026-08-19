import { ArrowTopRightOnSquareIcon, ChevronDownIcon } from '@heroicons/react/16/solid'
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownHeading,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
} from '../ui/dropdown.tsx'
import { elementOpenInUrls } from './elementOpenIn.ts'

type DropdownOpenElementProps = {
  type: string
  id: number
  lat?: number
  lon?: number
}

export function DropdownOpenElement({ type, id, lat, lon }: DropdownOpenElementProps) {
  const elementId = `${type}/${id}`
  const urls = elementOpenInUrls(elementId, lat, lon)

  return (
    <Dropdown>
      <DropdownButton
        outline
        aria-label={`Open ${elementId} in`}
        className="min-h-11 min-w-11 cursor-pointer touch-manipulation p-0 select-none"
      >
        <ArrowTopRightOnSquareIcon data-slot="icon" className="size-4" />
        <ChevronDownIcon data-slot="icon" className="size-4" />
      </DropdownButton>
      <DropdownMenu anchor="bottom end">
        <DropdownItem href={urls.osm} target="_blank" rel="noopener noreferrer">
          OSM Website
        </DropdownItem>
        <DropdownDivider />
        <DropdownSection>
          <DropdownHeading>History</DropdownHeading>
          <DropdownItem href={urls.history} target="_blank" rel="noopener noreferrer">
            OSM
          </DropdownItem>
          <DropdownItem href={urls.deepHistory} target="_blank" rel="noopener noreferrer">
            Deep History
          </DropdownItem>
          <DropdownItem href={urls.pewu} target="_blank" rel="noopener noreferrer">
            PeWu
          </DropdownItem>
        </DropdownSection>
        <DropdownDivider />
        <DropdownSection>
          <DropdownHeading>Editor</DropdownHeading>
          <DropdownItem href={urls.id} target="_blank" rel="noopener noreferrer">
            iD
          </DropdownItem>
          <DropdownItem href={urls.josm} target="_blank" rel="noopener noreferrer">
            JOSM
          </DropdownItem>
          <DropdownItem href={urls.level0} target="_blank" rel="noopener noreferrer">
            Level0
          </DropdownItem>
          <DropdownItem href={urls.rapid} target="_blank" rel="noopener noreferrer">
            RapiD
          </DropdownItem>
        </DropdownSection>
        {urls.mapillary && urls.panoramax ? (
          <>
            <DropdownDivider />
            <DropdownSection>
              <DropdownHeading>Street-level</DropdownHeading>
              <DropdownItem href={urls.mapillary} target="_blank" rel="noopener noreferrer">
                Mapillary
              </DropdownItem>
              <DropdownItem href={urls.panoramax} target="_blank" rel="noopener noreferrer">
                Panoramax
              </DropdownItem>
            </DropdownSection>
          </>
        ) : null}
      </DropdownMenu>
    </Dropdown>
  )
}
