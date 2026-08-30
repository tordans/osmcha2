import { useEffect, useState } from 'react'
import {
  Dropdown,
  DropdownButton,
  DropdownHeading,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
} from '../ui/dropdown.tsx'
import { CheckIcon, LinkIcon } from '../ui/icons.ts'
import { Tooltip } from '../ui/tooltip.tsx'
import { elementOpenInUrls } from './elementOpenIn.ts'
import { changesetObjectUrl, refParamFromElement } from './refSelection.ts'

const COPIED_RESET_MS = 2000

type DropdownOpenElementProps = {
  changesetId: number
  type: string
  id: number
  lat?: number
  lon?: number
}

export function DropdownOpenElement({ changesetId, type, id, lat, lon }: DropdownOpenElementProps) {
  const elementId = `${type}/${id}`
  const urls = elementOpenInUrls(elementId, lat, lon)
  const objectRef = refParamFromElement(type, id)
  const [copied, setCopied] = useState(false)

  useEffect(
    function resetCopiedIcon() {
      if (!copied) return
      const timeoutId = window.setTimeout(() => {
        setCopied(false)
      }, COPIED_RESET_MS)
      return function clearCopiedReset() {
        window.clearTimeout(timeoutId)
      }
    },
    [copied],
  )

  return (
    <Dropdown>
      <Tooltip
        as="span"
        content="Copy OSMCha link or open this object elsewhere"
        className="inline-flex"
      >
        <DropdownButton
          outline
          aria-label={`Links for ${elementId}`}
          className="min-h-11 min-w-11 cursor-pointer touch-manipulation p-0 select-none"
        >
          {copied ? <CheckIcon data-slot="icon" /> : <LinkIcon data-slot="icon" />}
        </DropdownButton>
      </Tooltip>
      <DropdownMenu
        anchor="bottom end"
        className="flex! w-max max-w-[calc(100vw-1rem)] min-w-max grid-cols-none! flex-row items-stretch divide-x divide-zinc-950/5 overflow-x-auto"
      >
        <DropdownSection className="shrink-0 grid-cols-none!">
          <DropdownHeading>OSMCha</DropdownHeading>
          <DropdownItem
            aria-label={`Copy OSMCha link to ${elementId}`}
            onClick={() => {
              if (!objectRef) return
              void navigator.clipboard
                .writeText(changesetObjectUrl(changesetId, objectRef))
                .then(() => {
                  setCopied(true)
                })
            }}
          >
            Copy link
          </DropdownItem>
        </DropdownSection>
        <DropdownSection className="shrink-0 grid-cols-none!">
          <DropdownHeading>History</DropdownHeading>
          <DropdownItem href={urls.history} target="_blank" rel="noopener noreferrer">
            History on OpenStreetMap.org
          </DropdownItem>
          <DropdownItem href={urls.deepHistory} target="_blank" rel="noopener noreferrer">
            Deep History
          </DropdownItem>
          <DropdownItem href={urls.pewu} target="_blank" rel="noopener noreferrer">
            PeWu
          </DropdownItem>
        </DropdownSection>
        <DropdownSection className="shrink-0 grid-cols-none!">
          <DropdownHeading>Open object in editor</DropdownHeading>
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
            Rapid
          </DropdownItem>
        </DropdownSection>
        {urls.mapillary && urls.panoramax ? (
          <DropdownSection className="shrink-0 grid-cols-none!">
            <DropdownHeading>Street-level</DropdownHeading>
            <DropdownItem href={urls.mapillary} target="_blank" rel="noopener noreferrer">
              Mapillary
            </DropdownItem>
            <DropdownItem href={urls.panoramax} target="_blank" rel="noopener noreferrer">
              Panoramax
            </DropdownItem>
          </DropdownSection>
        ) : null}
      </DropdownMenu>
    </Dropdown>
  )
}
