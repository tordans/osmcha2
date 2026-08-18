import { parse } from 'date-fns'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getObjAsQueryParam } from '../../utils/query_params.ts'
import { RelativeTime } from '../relative_time.tsx'
import { Avatar } from '../ui/avatar.tsx'
import { Button } from '../ui/button.tsx'
import { Subheading } from '../ui/heading.tsx'
import { Text, TextLink } from '../ui/text.tsx'
import { SignInButton } from './sign_in_button.tsx'
import { TrustWatchUser } from './trust_watch_user.tsx'
import { UserOSMLink } from './user_osm_link.tsx'

interface UserDetails {
  uid?: number | string
  name?: string
  img?: string
  accountCreated?: string
  count?: number
  changesets_in_osmcha?: number
  harmful_changesets?: number
  checked_changesets?: number
  description?: string
}

interface UserLinkProps {
  userDetails: UserDetails
  harmful: boolean
}

function avatarSrc(url?: string) {
  if (!url) return null
  if (url.startsWith('http://')) return `https://${url.slice(5)}`
  return url
}

function UserLink({ userDetails, harmful }: UserLinkProps) {
  const filterValue = harmful
    ? { label: 'Show Bad only', value: true }
    : { label: 'Show Good only', value: false }
  const label = harmful
    ? `${userDetails.harmful_changesets} Bad`
    : `${(userDetails.checked_changesets ?? 0) - (userDetails.harmful_changesets ?? 0)} Good`

  return (
    <TextLink
      href={`/?${getObjAsQueryParam('filters', {
        uids: [{ label: userDetails.uid, value: userDetails.uid }],
        harmful: [filterValue],
        date__gte: [{ label: '', value: '' }],
      })}`}
    >
      {label}
    </TextLink>
  )
}

interface UserProps {
  userDetails: UserDetails
  whosThat: string[]
  changesetUsername?: boolean
}

export function User({ userDetails, whosThat }: UserProps) {
  const registrationDate = userDetails.accountCreated
    ? parse(userDetails.accountCreated, "yyyy-MM-dd'T'HH:mm:ssX", new Date())
    : null
  const initials = userDetails.name?.slice(0, 2).toUpperCase()
  const editsHref = `/?${getObjAsQueryParam('filters', {
    uids: [{ label: userDetails.uid, value: userDetails.uid }],
    date__gte: [{ label: '', value: '' }],
  })}`
  const osmchaHref = `/?${getObjAsQueryParam('filters', {
    users: [{ label: userDetails.name, value: userDetails.name }],
    date__gte: [{ label: '', value: '' }],
  })}`

  return (
    <div className="px-3 py-2">
      <Subheading>
        User {userDetails.uid ? `/ ${userDetails.uid}` : null}
      </Subheading>
      {userDetails.name ? (
        <div className="mt-2 flex flex-col items-center gap-2">
          <Avatar
            src={avatarSrc(userDetails.img)}
            initials={initials}
            alt={userDetails.name}
            className="size-24"
          />
          <p className="text-center font-semibold text-zinc-700">{userDetails.name}</p>
          <Text className="text-center">
            {registrationDate != null && (
              <>
                Joined <RelativeTime datetime={registrationDate} />
                {' | '}
              </>
            )}
            {userDetails.count ? (
              <TextLink href={editsHref}>{`${userDetails.count} edits`}</TextLink>
            ) : (
              `${userDetails.changesets_in_osmcha} edits registered on OSMCha`
            )}
          </Text>
          <Text className="text-center">
            <UserLink userDetails={userDetails} harmful={true} />
            {' and '}
            <UserLink userDetails={userDetails} harmful={false} />
            {' changesets'}
          </Text>
          <TrustWatchUser user={userDetails as { name: string; uid: number }} />
          <div className="mt-1 flex flex-wrap items-center justify-center gap-1">
            <Button
              outline
              href={osmchaHref}
              className="min-h-11 cursor-pointer touch-manipulation select-none"
            >
              OSMCha
            </Button>
            <UserOSMLink userName={userDetails.name}>OSM</UserOSMLink>
            <Button
              outline
              href={`https://hdyc.neis-one.org/?${userDetails.name}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in HDYC"
              className="min-h-11 cursor-pointer touch-manipulation select-none"
            >
              HDYC
            </Button>
            <Button
              outline
              href={`https://www.missingmaps.org/users/#/${userDetails.name}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in Missing Maps"
              className="min-h-11 cursor-pointer touch-manipulation select-none"
            >
              Missing Maps
            </Button>
          </div>
          {whosThat.length > 1 && (
            <Text>
              Past usernames:{' '}
              {whosThat.slice(0, -1).map((name) => (
                <em key={name} className="not-italic">
                  {name}{' '}
                </em>
              ))}
            </Text>
          )}
          {userDetails.description ? (
            <div className="user-description mt-2 w-full text-sm break-words [&_a]:text-blue-700 [&_a]:underline [&_h2]:font-semibold">
              <Markdown remarkPlugins={[remarkGfm]}>{userDetails.description}</Markdown>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-2 flex flex-col items-center gap-3">
          <Avatar
            src={avatarSrc(userDetails.img)}
            initials={initials}
            alt=""
            className="size-24"
          />
          <SignInButton text="Sign in to see the user details" />
        </div>
      )}
    </div>
  )
}
