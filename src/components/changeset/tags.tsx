import { toast } from 'sonner'
import { useChangesetTagOptions } from '../../query/hooks/useChangesetTagOptions.ts'
import { useSetTag } from '../../query/hooks/useSetTag.ts'
import { useAuthStore } from '../../stores/authStore.ts'
import { Badge, BadgeButton } from '../ui/badge.tsx'
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from '../ui/dropdown.tsx'
import { CheckIcon, ChevronDownIcon, XMarkIcon } from '../ui/icons.ts'

type TagOption = { label: string; value: number }

type TaggedChangeset = {
  properties?: {
    tags?: Array<{ id?: number; name: string }>
  }
}

type TagsProps = {
  changesetId: number
  disabled: boolean
  currentChangeset: TaggedChangeset
  color?: 'green' | 'orange' | 'zinc'
  /** Harmful reviews can add tags; good reviews can only remove leftovers. */
  allowAdd?: boolean
}

export function Tags({
  changesetId,
  disabled,
  currentChangeset,
  color = 'zinc',
  allowAdd = true,
}: TagsProps) {
  const { data: options = [] } = useChangesetTagOptions()
  const token = useAuthStore((state) => state.token)
  const setTagMutation = useSetTag()
  const tags = currentChangeset.properties?.tags ?? []
  const selectedIds = new Set(tags.map((tag) => tag.id).filter((id) => id != null))
  const showDropdown = allowAdd && options.length > 0

  function requireToken(action: 'add' | 'remove') {
    if (token) return true
    toast.error(`You must be logged in to ${action} tags`)
    return false
  }

  function onAdd(option: TagOption) {
    if (!requireToken('add')) return
    setTagMutation.mutate({ changesetId, tag: option, remove: false })
  }

  function onRemove(option: TagOption) {
    if (!requireToken('remove')) return
    setTagMutation.mutate({ changesetId, tag: option, remove: true })
  }

  if (!showDropdown && tags.length === 0) return null

  return (
    <>
      {tags.map((tag) => {
        const option = tag.id == null ? null : { label: tag.name, value: tag.id }
        if (!allowAdd && option) {
          return (
            <BadgeButton
              key={tag.id}
              color={color}
              rounded="none"
              disabled={disabled}
              aria-label={`Remove tag ${tag.name}`}
              onClick={() => onRemove(option)}
              className="h-full min-h-0 cursor-pointer touch-manipulation items-stretch rounded-none select-none"
            >
              {tag.name}
              <XMarkIcon className="size-3.5" />
            </BadgeButton>
          )
        }
        return (
          <Badge
            key={tag.id ?? tag.name}
            color={color}
            rounded="none"
            className="h-full rounded-none"
          >
            {tag.name}
          </Badge>
        )
      })}
      {showDropdown ? (
        <Dropdown className="contents">
          <DropdownButton
            as={BadgeButton}
            color={color}
            rounded="none"
            disabled={disabled}
            className="h-full min-h-0 cursor-pointer touch-manipulation items-stretch rounded-none select-none"
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
      ) : null}
    </>
  )
}
