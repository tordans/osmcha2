import { HandThumbDownIcon, HandThumbUpIcon } from '@heroicons/react/16/solid'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth.ts'
import { useUpdateUserDetails } from '../../query/hooks/useUpdateUserDetails.ts'
import { Button } from '../ui/button.tsx'
import { Field, FieldGroup, Label } from '../ui/fieldset.tsx'
import { Text } from '../ui/text.tsx'
import { Textarea } from '../ui/textarea.tsx'

type UserDetails = {
  message_good?: string
  message_bad?: string
  comment_feature?: boolean
}

export function EditUserDetails() {
  const { token, user } = useAuth()
  const updateMutation = useUpdateUserDetails()
  const userDetails = user as UserDetails | undefined

  const [messageGood, setMessageGood] = useState(userDetails?.message_good || '')
  const [messageBad, setMessageBad] = useState(userDetails?.message_bad || '')
  const commentFeature = userDetails?.comment_feature ?? false

  const handleSubmit = () => {
    if (!token) return
    updateMutation.mutate({
      messageGood,
      messageBad,
      commentFeature,
    })
  }

  return (
    <FieldGroup>
      <Field>
        <Label className="flex items-center gap-2">
          Default comment for changesets reviewed as GOOD
          <HandThumbUpIcon className="size-4 text-green-700" />
        </Label>
        <Textarea
          rows={4}
          placeholder="Define a default message to the changesets you review as good. You can edit it before post a comment."
          value={messageGood}
          onChange={(event) => setMessageGood(event.target.value)}
        />
      </Field>
      <Field>
        <Label className="flex items-center gap-2">
          Default comment for changesets reviewed as BAD
          <HandThumbDownIcon className="size-4 text-red-700" />
        </Label>
        <Textarea
          rows={4}
          placeholder="Define a default message to the changesets you review as bad. You can edit it before post a comment."
          value={messageBad}
          onChange={(event) => setMessageBad(event.target.value)}
        />
      </Field>
      <div>
        <Button
          type="button"
          className="min-h-11"
          onClick={handleSubmit}
          disabled={updateMutation.isPending}
        >
          Save Preferences
        </Button>
        {updateMutation.isPending ? <Text className="mt-2">Saving…</Text> : null}
      </div>
    </FieldGroup>
  )
}
