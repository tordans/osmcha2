import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownMenu,
} from '@app/_components/core/dropdown'
import { Square3Stack3DIcon } from '@heroicons/react/20/solid'
import { Dispatch, SetStateAction } from 'react'
import { mapStyles, type TMapStyle } from './utils/mapStyles'

type Props = {
  useBackground?: string
  currentMapstyle: string
  setMapStyle: Dispatch<SetStateAction<TMapStyle>>
}

export const MapStyleControl = ({ useBackground, currentMapstyle, setMapStyle }: Props) => {
  return (
    <div className="absolute bottom-2 right-2">
      <Dropdown>
        <DropdownButton aria-label="Change background map">
          <Square3Stack3DIcon className="size-4" />
        </DropdownButton>
        <DropdownMenu anchor="top end">
          {Object.entries(mapStyles).map(([key, { name }]) => {
            return (
              <DropdownItem
                key={key}
                onClick={() => setMapStyle(key as TMapStyle)}
                current={key === currentMapstyle}
              >
                {name}
              </DropdownItem>
            )
          })}
          <DropdownDivider />
          <div className="px-3 py-2 text-sm">Use imagery: {useBackground || 'unkown'}</div>
        </DropdownMenu>
      </Dropdown>
    </div>
  )
}
