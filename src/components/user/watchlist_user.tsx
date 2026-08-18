import { useState, type KeyboardEvent } from 'react'
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

export function WatchListUser({ onSave }: { onSave: (username: string, uid: string) => void }) {
  const [username, setUsername] = useState('')
  const [uid, setUid] = useState('')
  const [isValidUsername, setIsValidUsername] = useState(true)
  const [isValidUid, setIsValidUid] = useState(true)
  const [pending, setPending] = useState(false)

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

  const onAdd = async () => {
    if (pending) return
    const lookup =
      uid.length > 0 ? fetchByUid(uid) : username.length > 0 ? fetchByUsername(username) : null
    if (!lookup) {
      setIsValidUsername(false)
      setIsValidUid(false)
      return
    }
    setPending(true)
    try {
      const user = await lookup
      onSave(user.username, user.uid)
      setUsername('')
      setUid('')
      setIsValidUsername(true)
      setIsValidUid(true)
    } catch {
      const byUid = uid.length > 0
      setIsValidUid(!byUid)
      setIsValidUsername(byUid)
    } finally {
      setPending(false)
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') void onAdd()
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        className="min-h-11 min-w-40 flex-1"
        value={username}
        invalid={!isValidUsername}
        onChange={(event) => {
          setUsername(event.target.value)
          setUid('')
          setIsValidUsername(true)
          setIsValidUid(true)
        }}
        onKeyDown={onKeyDown}
        placeholder="Username"
        type="text"
      />
      <Text className="uppercase">or</Text>
      <Input
        className="min-h-11 min-w-40 flex-1"
        value={uid}
        invalid={!isValidUid}
        onChange={(event) => {
          setUid(event.target.value)
          setUsername('')
          setIsValidUsername(true)
          setIsValidUid(true)
        }}
        onKeyDown={onKeyDown}
        placeholder="UID"
        type="text"
      />
      <Button type="button" className="min-h-11" onClick={() => void onAdd()} disabled={pending}>
        {pending ? 'Adding...' : 'Add'}
      </Button>
    </div>
  )
}
