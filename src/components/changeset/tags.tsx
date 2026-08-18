import { CheckIcon, ChevronDownIcon } from '@heroicons/react/16/solid'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { API_URL } from '../../config/index.ts'
import { useSetTag } from '../../query/hooks/useSetTag.ts'
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

let cachedTagsPromise: Promise<any> | null = null

export function Tags({ changesetId, disabled, currentChangeset }: TagsProps) {
  const [options, setOptions] = useState<Array<{ label: string; value: number }>>([])
  const token = useAuthStore((state) => state.token)
  const setTagMutation = useSetTag()

  useEffect(() => {
    if (!cachedTagsPromise) {
      cachedTagsPromise = fetch(`${API_URL}/tags/`)
        .then((response) => response.json())
        .catch((error) => {
          console.error('Failed to fetch tags:', error)
          return { results: [] }
        })
    }

    let cancelled = false
    cachedTagsPromise
      .then((json) => {
        if (cancelled) return
        const selectData = json.results.filter((d: any) => d.is_visible && d.for_changeset)
        setOptions(selectData.map((d: any) => ({ label: d.name, value: d.id })))
      })
      .catch((error) => {
        if (cancelled) return
        console.error('Error processing tags:', error)
      })
    return () => {
      cancelled = true
    }
  }, [])

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
