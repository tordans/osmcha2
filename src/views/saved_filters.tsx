import { RssIcon, TrashIcon } from '@heroicons/react/16/solid'
import { useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router'
import { AccountPage, SecondaryPagesHeader } from '../components/secondary_pages_header.tsx'
import { Badge } from '../components/ui/badge.tsx'
import { Button } from '../components/ui/button.tsx'
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
import { API_URL } from '../config/index.ts'
import { useAuth } from '../hooks/useAuth.ts'
import { useFilters } from '../hooks/useFilters.ts'
import { useAllAOIs } from '../query/hooks/useAOI.ts'
import { useCreateAOI, useDeleteAOI } from '../query/hooks/useAOIMutations.ts'

type AoiFeature = {
  id: string
  properties?: { name?: string }
}

function aoiList(data: unknown): AoiFeature[] {
  if (!data) return []
  if (Array.isArray(data)) return data as AoiFeature[]
  if (typeof data === 'object' && 'features' in data) {
    const features = (data as { features: unknown }).features
    if (Array.isArray(features)) return features as AoiFeature[]
  }
  return []
}

function SaveButton({ onCreate }: { onCreate: (value: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')

  const commit = () => {
    setEditing(false)
    if (value) {
      onCreate(value)
      setValue('')
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      commit()
    } else if (event.key === 'Escape') {
      setEditing(false)
      setValue('')
    }
  }

  if (!editing) {
    return (
      <Button type="button" className="min-h-11" onClick={() => setEditing(true)}>
        Save Filter
      </Button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        className="min-h-11 min-w-40 flex-1"
        placeholder="Filter name"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <Button type="button" className="min-h-11" onClick={commit}>
        Save
      </Button>
    </div>
  )
}

type UserData = {
  avatar?: string
}

export function SavedFilters() {
  const { token, user } = useAuth()
  const currentUser = user as UserData | undefined
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
          void navigate('/user')
        }
      },
    })
  }

  const aois = aoiList(aoisQuery.data)

  return (
    <AccountPage>
      <SecondaryPagesHeader title="Saved Filters" avatar={currentUser?.avatar} />
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
                        <Button plain href={`/filters?aoi=${aoi.id}`} className="min-h-11">
                          {aoi.properties?.name}
                        </Button>
                        {aoiId === aoi.id ? <Badge color="zinc">Active</Badge> : null}
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
                          onClick={() => removeAOI(aoi.id)}
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
