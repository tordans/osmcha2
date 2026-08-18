import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { Button } from '../ui/button.tsx'
import { Input } from '../ui/input.tsx'

const trustedUserSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
})

export function TrustedListUser({ onSave }: { onSave: (username: string) => void }) {
  const form = useForm({
    defaultValues: { username: '' },
    validators: {
      onSubmit: trustedUserSchema,
    },
    onSubmit: ({ value, formApi }) => {
      onSave(value.username.trim())
      formApi.reset()
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
      <form.Field name="username">
        {(field) => (
          <Input
            className="min-h-11 min-w-40 flex-1"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            placeholder="Username"
            type="text"
          />
        )}
      </form.Field>
      <Button type="submit" className="min-h-11">
        Add
      </Button>
    </form>
  )
}
