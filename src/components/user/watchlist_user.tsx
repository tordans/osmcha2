import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { handleResponse } from '../../network/request.ts'
import { Button } from '../ui/button.tsx'
import { Input } from '../ui/input.tsx'
import { Text } from '../ui/text.tsx'

type OsmUser = {
  uid: string
  username: string
}

type OsmUserJson = {
  user: { id: number; display_name: string }
}

type OsmChangesetsJson = {
  changesets: Array<{ uid: number }>
}

const watchlistUserSchema = z
  .object({
    username: z.string(),
    uid: z.string(),
  })
  .refine((value) => value.username.length > 0 || value.uid.length > 0, {
    message: 'Username or UID is required',
    path: ['username'],
  })

export function WatchListUser({ onSave }: { onSave: (username: string, uid: string) => void }) {
  const [pending, setPending] = useState(false)
  const [lookupError, setLookupError] = useState<'username' | 'uid' | null>(null)

  const fetchByUid = async (userId: string): Promise<OsmUser> => {
    const res = await fetch(`https://www.openstreetmap.org/api/0.6/user/${userId}.json`)
    const data = await handleResponse<OsmUserJson>(res)
    return { uid: data.user.id.toString(), username: data.user.display_name }
  }

  const fetchByUsername = async (displayName: string): Promise<OsmUser> => {
    const res = await fetch(
      `https://www.openstreetmap.org/api/0.6/changesets.json?display_name=${displayName}`,
    )
    const data = await handleResponse<OsmChangesetsJson>(res)
    const changeset = data.changesets[0]
    if (!changeset) throw new Error('No changesets found for user')
    return fetchByUid(changeset.uid.toString())
  }

  const form = useForm({
    defaultValues: { username: '', uid: '' },
    validators: {
      onSubmit: watchlistUserSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      if (pending) return
      setPending(true)
      setLookupError(null)
      try {
        const lookup =
          value.uid.length > 0
            ? fetchByUid(value.uid)
            : value.username.length > 0
              ? fetchByUsername(value.username)
              : null
        if (!lookup) {
          setPending(false)
          return
        }

        const user = await lookup
        onSave(user.username, user.uid)
        formApi.reset()
      } catch (error) {
        const byUid = value.uid.length > 0
        setLookupError(byUid ? 'uid' : 'username')
        toast.error('Could not find user', {
          description: error instanceof Error ? error.message : undefined,
        })
      }
      setPending(false)
    },
  })

  return (
    <form
      className="flex flex-wrap items-center gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <form.Field
        name="username"
        listeners={{
          onChange: () => {
            form.setFieldValue('uid', '')
            setLookupError(null)
          },
        }}
      >
        {(field) => (
          <Input
            className="min-w-40 flex-1"
            value={field.state.value}
            invalid={lookupError === 'username'}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            placeholder="Username"
            type="text"
          />
        )}
      </form.Field>
      <Text className="uppercase">or</Text>
      <form.Field
        name="uid"
        listeners={{
          onChange: () => {
            form.setFieldValue('username', '')
            setLookupError(null)
          },
        }}
      >
        {(field) => (
          <Input
            className="min-w-40 flex-1"
            value={field.state.value}
            invalid={lookupError === 'uid'}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            placeholder="UID"
            type="text"
          />
        )}
      </form.Field>
      <Button type="submit" className="min-h-11" disabled={pending}>
        {pending ? 'Adding...' : 'Add'}
      </Button>
    </form>
  )
}
