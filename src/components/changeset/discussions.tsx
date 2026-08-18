import { ChatBubbleLeftIcon } from '@heroicons/react/16/solid'
import { parse } from 'date-fns'
import Linkify from 'linkify-react'
import { useAuth } from '../../hooks/useAuth.ts'
import { RelativeTime } from '../relative_time.tsx'
import { CommentForm } from './comment.tsx'
import { SignInButton } from './sign_in_button.tsx'
import TranslateButton from './translate_button.tsx'
import { UserOSMLink } from './user_osm_link.tsx'

interface DiscussionsProps {
  discussions: any[]
  changesetId: number
  changesetAuthor: string
  changesetIsHarmful: boolean
}

interface UserDetails {
  username?: string
  message_bad?: string
  message_good?: string
}

function Discussions({
  discussions,
  changesetId,
  changesetAuthor,
  changesetIsHarmful,
}: DiscussionsProps) {
  const { token, user } = useAuth()
  const userDetails = user as UserDetails | undefined

  return (
    <section className="mt-4 px-3">
      {discussions.length === 0 ? (
        <p className="w-full p-5 text-center text-zinc-500">No comments, yet</p>
      ) : (
        discussions.map((comment, index) => {
          const isChangesetUser = comment.user === changesetAuthor
          const commentDate = comment.date
            ? parse(comment.date, "yyyy-MM-dd'T'HH:mm:ssX", new Date())
            : null
          return (
            <div
              key={comment.id ?? `${comment.user}-${comment.date}-${index}`}
              className="relative mb-4 border-b border-b-zinc-100 pb-4 last:border-b-0"
            >
              <div className="flex items-center justify-between gap-1">
                <h4 className="flex items-center gap-1 font-semibold text-zinc-700">
                  <ChatBubbleLeftIcon className="size-4 flex-none" />
                  <span>
                    Comment by{' '}
                    <UserOSMLink userName={comment.user} linkClasses="text-blue-700 underline">
                      {comment.user}
                    </UserOSMLink>{' '}
                    {isChangesetUser ? (
                      <span className="font-normal text-zinc-400">(changeset author)</span>
                    ) : null}{' '}
                    {commentDate ? <RelativeTime datetime={commentDate} /> : null}:
                  </span>
                </h4>
                <TranslateButton text={comment.text} />
              </div>
              <p className="mt-1 border-l-2 border-l-zinc-200 py-1 pl-2 break-words">
                <Linkify
                  options={{
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    className: 'text-blue-700 underline',
                  }}
                >
                  {comment.text}
                </Linkify>
              </p>
            </div>
          )
        })
      )}

      {token ? (
        <div className="my-3">
          <CommentForm
            changesetId={changesetId}
            changesetIsHarmful={changesetIsHarmful}
            discussions={discussions}
            token={token}
            userDetails={userDetails || {}}
          />
        </div>
      ) : (
        <div className="flex justify-center py-4">
          <SignInButton text="Sign in to post comments" />
        </div>
      )}
    </section>
  )
}

export { Discussions }
