import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { useAuthStore } from '../stores/authStore.ts'
import { Button } from './ui/button.tsx'
import { Input } from './ui/input.tsx'
import { Text, TextLink } from './ui/text.tsx'

const tokenSchema = z.object({
  token: z.string().trim().min(1, 'API token is required'),
})

interface TokenImportProps {
  compact?: boolean
}

export function TokenImport({ compact = false }: TokenImportProps) {
  const form = useForm({
    defaultValues: { token: '' },
    validators: {
      onSubmit: tokenSchema,
    },
    onSubmit: ({ value }) => {
      useAuthStore.getState().setToken(value.token.trim())
      form.reset()
    },
  })

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
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
        <form.Field name="token">
          {(field) => (
            <Input
              type="password"
              name="osmcha-api-token"
              placeholder="API token"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="OSMCha API token"
              className="w-44"
            />
          )}
        </form.Field>
        <form.Subscribe selector={(state) => state.values.token}>
          {(token) => (
            <Button
              type="submit"
              disabled={!token.trim()}
              className="min-h-11 cursor-pointer touch-manipulation select-none"
            >
              Save
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
