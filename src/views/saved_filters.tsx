import { useForm } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import { AccountPage, SecondaryPagesHeader } from '../components/secondary_pages_header.tsx'
import { Badge } from '../components/ui/badge.tsx'
import { Button } from '../components/ui/button.tsx'
import { RssIcon, TrashIcon } from '../components/ui/icons.ts'
import { Input } from '../components/ui/input.tsx'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table.tsx'
import { Text } from '../components/ui/text.tsx'
import { API_URL } from '../config/constants.ts'
import { useAuth } from '../hooks/useAuth.ts'
import { useFilters } from '../hooks/useFilters.ts'
import type { AoiFeature } from '../network/aoi.ts'
import { useAllAOIs } from '../query/hooks/useAOI.ts'
import { useCreateAOI, useDeleteAOI } from '../query/hooks/useAOIMutations.ts'
import { RouterLink } from '../routing/RouterLink.tsx'

function SaveButton({ onCreate }: { onCreate: (value: string) => void }) {
  const [editing, setEditing] = useState(false)

  const form = useForm({
    defaultValues: { name: '' },
    validators: {
      onSubmit: z.object({
        name: z.string().trim().min(1, 'Filter name is required'),
      }),
    },
    onSubmit: ({ value, formApi }) => {
      onCreate(value.name.trim())
      formApi.reset()
      setEditing(false)
    },
  })

  if (!editing) {
    return (
      <Button type="button" className="min-h-11" onClick={() => setEditing(true)}>
        Save Filter
      </Button>
    )
  }

  return (
    <form
      className="flex flex-wrap items-center gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <form.Field name="name">
        {(field) => (
          <Input
            className="min-w-40 flex-1"
            placeholder="Filter name"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setEditing(false)
                form.reset()
              }
            }}
          />
        )}
      </form.Field>
      <Button type="submit" className="min-h-11">
        Save
      </Button>
    </form>
  )
}

export function SavedFilters() {
  const { token, user } = useAuth()
  const { filters, aoiId, clearFilters } = useFilters()
  const aoisQuery = useAllAOIs()
  const createMutation = useCreateAOI()
  const deleteMutation = useDeleteAOI()
  const navigate = useNavigate()

  const createAOI = (name: string) => {
    if (!name || !token) return
    createMutation.mutate({ name, filters })
  }

  const removeAOI = (aoiIdToRemove: string) => {
    if (!aoiIdToRemove || !token) return
    deleteMutation.mutate(aoiIdToRemove, {
      onSuccess: () => {
        if (aoiIdToRemove === aoiId) {
          clearFilters()
          void navigate({ to: '/user' })
        }
      },
    })
  }

  const aois: AoiFeature[] = aoisQuery.data ?? []

  return (
    <AccountPage>
      <SecondaryPagesHeader title="Saved Filters" avatar={user?.avatar ?? undefined} />
      {token ? (
        <div className="flex flex-col gap-6">
          {aois.length === 0 ? (
            <Text>No saved filters yet.</Text>
          ) : (
            <Table striped>
              <TableHead>
                <TableRow>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>
                    <span className="sr-only">Actions</span>
                  </TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {aois.map((aoi) => (
                  <TableRow key={aoi.id}>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <RouterLink
                          to="/filters"
                          search={{ aoi: String(aoi.id) }}
                          className="inline-flex min-h-11 cursor-pointer touch-manipulation items-center rounded-lg px-2 text-sm font-semibold text-zinc-950 select-none hover:bg-zinc-950/5"
                        >
                          {aoi.properties?.name}
                        </RouterLink>
                        {aoiId === String(aoi.id) ? <Badge color="zinc">Active</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          outline
                          href={`${API_URL}/aoi/${aoi.id}/changesets/feed/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-11"
                        >
                          <RssIcon data-slot="icon" />
                          RSS Feed
                        </Button>
                        <Button
                          plain
                          type="button"
                          className="min-h-11"
                          onClick={() => removeAOI(String(aoi.id))}
                        >
                          <TrashIcon data-slot="icon" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <SaveButton onCreate={createAOI} />
        </div>
      ) : null}
    </AccountPage>
  )
}
