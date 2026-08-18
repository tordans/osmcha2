import { useEffect, useRef, useState } from 'react'
import { postComment } from '../../network/changeset.ts'
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
  const template = commentTemplate({ changesetIsHarmful, discussions, userDetails })
  const [draft, setDraft] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(false)
  const pendingRef = useRef<{ cancel: () => void } | null>(null)
  const value = draft ?? template

  useEffect(function cancelPendingCommentOnUnmount() {
    return function cancelPendingComment() {
      pendingRef.current?.cancel()
    }
  }, [])

  const handleSubmit = () => {
    if (!value) return
    pendingRef.current?.cancel()
    const pending = cancelablePromise(postComment(changesetId, value))
    pendingRef.current = pending
    pending.promise
      .then(() => {
        setSuccess(true)
        setError(false)
        setDraft('')
      })
      .catch((e) => {
        if (e?.isCanceled) return
        console.log(e)
        setError(true)
        setSuccess(false)
      })
  }

  if (!token) return null

  return (
    <div className="flex flex-col gap-2">
      {success && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-center text-sm text-green-800">
          <strong className="font-semibold">Comment successfully posted.</strong>
          <br />
          It will appear on OSMCha after some minutes.
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-800">
          <strong className="font-semibold">It was not possible to post your comment.</strong>
        </p>
      )}
      <Textarea
        placeholder="Provide constructive feedback to the mapper with a changeset comment."
        value={value}
        onChange={(event) => {
          setDraft(event.target.value)
          if (error) setError(false)
          if (success) setSuccess(false)
        }}
        rows={4}
      />
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          className="min-h-11 cursor-pointer touch-manipulation select-none"
        >
          Post Comment
        </Button>
      </div>
    </div>
  )
}
