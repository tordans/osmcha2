import { useState } from 'react'
import { useAuthStore } from '../stores/authStore.ts'
import { Button } from './ui/button.tsx'
import { Input } from './ui/input.tsx'
import { Text, TextLink } from './ui/text.tsx'

interface TokenImportProps {
  compact?: boolean
}

export function TokenImport({ compact = false }: TokenImportProps) {
  const [value, setValue] = useState('')

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const token = value.trim()
    if (!token) return
    useAuthStore.getState().setToken(token)
    setValue('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={compact ? 'flex items-center gap-2' : 'flex flex-col items-center gap-2'}
    >
      {!compact && (
        <Text className="max-w-sm px-3 text-center">
          Paste an API token from{' '}
          <TextLink href="https://osmcha.org" target="_blank" rel="noreferrer">
            osmcha.org
          </TextLink>
          . OSM sign-in works only on localhost.
        </Text>
      )}
      <div className="flex items-center gap-2">
        <Input
          type="password"
          name="osmcha-api-token"
          placeholder="API token"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="OSMCha API token"
          className="w-44"
        />
        <Button
          type="submit"
          disabled={!value.trim()}
          className="min-h-11 cursor-pointer touch-manipulation select-none"
        >
          Save
        </Button>
      </div>
    </form>
  )
}
