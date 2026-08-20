import { useForm } from '@tanstack/react-form'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { postComment } from '../../network/changeset.ts'
import { changesetDiscussionQueryOptions } from '../../query/options/changeset.ts'
import { cancelablePromise } from '../../utils/promise.ts'
import { Button } from '../ui/button.tsx'
import { Textarea } from '../ui/textarea.tsx'

type CommentFormProps = {
  token: string
  changesetId: number
  userDetails: {
    username?: string
    message_bad?: string
    message_good?: string
  }
  changesetIsHarmful: boolean
  discussions: any[]
}

function commentTemplate({
  changesetIsHarmful,
  discussions,
  userDetails,
}: Pick<CommentFormProps, 'changesetIsHarmful' | 'discussions' | 'userDetails'>) {
  const userCommentedBefore = discussions.some(
    (item) => (item.user ?? item.userName) === userDetails.username,
  )
  if (changesetIsHarmful == null || userCommentedBefore) return ''
  return changesetIsHarmful ? (userDetails.message_bad ?? '') : (userDetails.message_good ?? '')
}

export function CommentForm({
  token,
  changesetId,
  userDetails,
  changesetIsHarmful,
  discussions,
}: CommentFormProps) {
  const queryClient = useQueryClient()
  const template = commentTemplate({ changesetIsHarmful, discussions, userDetails })
  const pendingRef = useRef<{ cancel: () => void } | null>(null)

  const form = useForm({
    defaultValues: { comment: template },
    onSubmit: ({ value, formApi }) => {
      const commentValue = value.comment.trim()
      if (!commentValue) return

      pendingRef.current?.cancel()
      const pending = cancelablePromise(postComment(changesetId, commentValue))
      pendingRef.current = pending
      pending.promise
        .then(() => {
          toast.success('Comment posted', {
            description: 'Appears on OSMCha in a few minutes',
          })
          formApi.reset({ comment: '' })
          void queryClient.invalidateQueries({
            queryKey: changesetDiscussionQueryOptions(changesetId).queryKey,
          })
        })
        .catch((error) => {
          if (error?.isCanceled) return
          toast.error('Could not post comment', {
            description: error instanceof Error ? error.message : undefined,
          })
        })
    },
  })

  useEffect(function cancelPendingCommentOnUnmount() {
    return function cancelPendingComment() {
      pendingRef.current?.cancel()
    }
  }, [])

  if (!token) return null

  return (
    <div className="flex flex-col gap-2">
      <form.Field name="comment">
        {(field) => (
          <Textarea
            placeholder="Provide constructive feedback to the mapper with a changeset comment."
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            rows={4}
          />
        )}
      </form.Field>
      <div className="flex justify-end">
        <Button
          type="button"
          className="min-h-11 cursor-pointer touch-manipulation select-none"
          onClick={() => void form.handleSubmit()}
        >
          Post Comment
        </Button>
      </div>
    </div>
  )
}
