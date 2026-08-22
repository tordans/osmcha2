import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { useAuth } from '../../hooks/useAuth.ts'
import { useUpdateUserDetails } from '../../query/hooks/useUpdateUserDetails.ts'
import { Button } from '../ui/button.tsx'
import { Field, FieldGroup, Label } from '../ui/fieldset.tsx'
import { CircleCheckIcon, FlagIcon } from '../ui/icons.ts'
import { Text } from '../ui/text.tsx'
import { Textarea } from '../ui/textarea.tsx'

export function EditUserDetails() {
  const { token, user } = useAuth()
  const updateMutation = useUpdateUserDetails()
  const commentFeature = user?.comment_feature ?? false

  const form = useForm({
    defaultValues: {
      messageGood: user?.message_good || '',
      messageBad: user?.message_bad || '',
    },
    validators: {
      onSubmit: z.object({
        messageGood: z.string(),
        messageBad: z.string(),
      }),
    },
    onSubmit: ({ value }) => {
      if (!token) return
      updateMutation.mutate({
        messageGood: value.messageGood,
        messageBad: value.messageBad,
        commentFeature,
      })
    },
  })

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <FieldGroup>
        <form.Field name="messageGood">
          {(field) => (
            <Field>
              <Label className="flex items-center gap-2">
                Default comment when you mark Looks OK
                <CircleCheckIcon variant="fill" className="size-4 text-green-700" />
              </Label>
              <Textarea
                rows={4}
                placeholder="Define a default message for changesets you mark as Looks OK. You can edit it before posting a comment."
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
            </Field>
          )}
        </form.Field>
        <form.Field name="messageBad">
          {(field) => (
            <Field>
              <Label className="flex items-center gap-2">
                Default comment when you mark Needs a look
                <FlagIcon variant="fill" className="size-4 text-orange-600" />
              </Label>
              <Textarea
                rows={4}
                placeholder="Define a default message for changesets you mark as Needs a look. You can edit it before posting a comment."
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
            </Field>
          )}
        </form.Field>
        <div>
          <Button type="submit" className="min-h-11" disabled={updateMutation.isPending}>
            Save Preferences
          </Button>
          {updateMutation.isPending ? <Text className="mt-2">Saving…</Text> : null}
        </div>
      </FieldGroup>
    </form>
  )
}
