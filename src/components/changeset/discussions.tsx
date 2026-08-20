import { useAuth } from '../../hooks/useAuth.ts'
import { parseOsmDate } from '../../utils/datetime.ts'
import { DebugDataHelperDialog } from '../debug/DebugDataHelperDialog.tsx'
import { RelativeTime } from '../relative_time.tsx'
import { LinkifyText } from '../text/LinkifyText.tsx'
import { ChatBubbleLeftIcon } from '../ui/icons.ts'
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
    <section className="p-2.5">
      {discussions.length === 0 ? (
        <p className="w-full p-5 text-center text-zinc-500">No comments, yet</p>
      ) : (
        discussions.map((comment, index) => {
          const isChangesetUser = comment.user === changesetAuthor
          const commentDate = comment.date ? parseOsmDate(comment.date) : null
          return (
            <div
              key={comment.id ?? `${comment.user}-${comment.date}-${index}`}
              className="relative mb-4 border-b border-b-zinc-100 pb-4 last:border-b-0"
            >
              <div className="absolute top-0 right-0 z-10">
                <TranslateButton text={comment.text} />
              </div>
              <h4 className="flex items-center gap-1 pr-11 font-semibold text-zinc-700">
                <ChatBubbleLeftIcon variant="fill" className="size-4 flex-none" />
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
              <p className="mt-1 border-l-2 border-l-zinc-200 py-1 pl-2 break-words">
                <LinkifyText text={comment.text} nl2br />
              </p>
              <DebugDataHelperDialog data={comment} title="this comment" />
            </div>
          )
        })
      )}

      {token ? (
        <div className="my-3">
          <CommentForm
            key={changesetId}
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
