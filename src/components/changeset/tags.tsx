import { CheckIcon, ChevronDownIcon } from '@heroicons/react/16/solid'
import { toast } from 'sonner'
import { useChangesetTagOptions } from '../../query/hooks/useChangesetTagOptions.ts'
import { useSetTag } from '../../query/hooks/useSetTag.ts'
import { useAuthStore } from '../../stores/authStore.ts'
import { BadgeButton } from '../ui/badge.tsx'
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from '../ui/dropdown.tsx'

interface TagsProps {
  changesetId: number
  disabled: boolean
  currentChangeset: any
  color?: 'green' | 'orange' | 'zinc'
}

export function Tags({ changesetId, disabled, currentChangeset, color = 'zinc' }: TagsProps) {
  const { data: options = [] } = useChangesetTagOptions()
  const token = useAuthStore((state) => state.token)
  const setTagMutation = useSetTag()

  const onAdd = (obj: { label: string; value: number }) => {
    if (!token) {
      toast.error('You must be logged in to add tags')
      return
    }

    setTagMutation.mutate({
      changesetId,
      tag: obj,
      remove: false,
    })
  }

  const onRemove = (obj: { label: string; value: number }) => {
    if (!token) {
      toast.error('You must be logged in to remove tags')
      return
    }

    setTagMutation.mutate({
      changesetId,
      tag: obj,
      remove: true,
    })
  }

  if (!currentChangeset || options.length === 0) return null

  const tags = currentChangeset.properties?.tags || []
  const selectedIds = new Set(tags.map((t: any) => t.id))

  return (
    <Dropdown className="contents">
      <DropdownButton
        as={BadgeButton}
        color={color}
        rounded="none"
        disabled={disabled}
        className="h-full cursor-pointer touch-manipulation items-center rounded-none select-none"
      >
        Tags
        <ChevronDownIcon className="size-3.5" />
      </DropdownButton>
      <DropdownMenu anchor="bottom end">
        {options.map((option) => {
          const selected = selectedIds.has(option.value)
          return (
            <DropdownItem
              key={option.value}
              onClick={() => (selected ? onRemove(option) : onAdd(option))}
            >
              {selected ? <CheckIcon data-slot="icon" /> : null}
              <DropdownLabel>{option.label}</DropdownLabel>
            </DropdownItem>
          )
        })}
      </DropdownMenu>
    </Dropdown>
  )
}
