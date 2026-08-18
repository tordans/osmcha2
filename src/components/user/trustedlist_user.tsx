import { useState, type KeyboardEvent } from 'react'
import { Button } from '../ui/button.tsx'
import { Input } from '../ui/input.tsx'

export function TrustedListUser({ onSave }: { onSave: (username: string) => void }) {
  const [username, setUsername] = useState('')

  const onAdd = () => {
    if (!username) return
    onSave(username)
    setUsername('')
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') onAdd()
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        className="min-h-11 min-w-40 flex-1"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Username"
        type="text"
      />
      <Button type="button" className="min-h-11" onClick={onAdd}>
        Add
      </Button>
    </div>
  )
}
