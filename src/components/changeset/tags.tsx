import { CheckIcon, ChevronDownIcon } from '@heroicons/react/16/solid'
import { toast } from 'sonner'
import { useSetTag } from '../../query/hooks/useSetTag.ts'
import { useChangesetTagOptions } from '../../query/hooks/useChangesetTagOptions.ts'
import { useAuthStore } from '../../stores/authStore.ts'
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
}

export function Tags({ changesetId, disabled, currentChangeset }: TagsProps) {
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
    <Dropdown>
      <DropdownButton
        outline
        disabled={disabled}
        className="min-h-11 cursor-pointer touch-manipulation select-none"
      >
        Tags{tags.length > 0 ? ` (${tags.length})` : ''}
        <ChevronDownIcon data-slot="icon" />
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
