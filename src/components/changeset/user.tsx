import { parse } from 'date-fns'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { RouterLink } from '../../routing/RouterLink.tsx'
import { MigrationAudit, MigrationAuditLegend } from '../debug/migrationAudit.tsx'
import { RelativeTime } from '../relative_time.tsx'
import { Avatar } from '../ui/avatar.tsx'
import { Button } from '../ui/button.tsx'
import { Subheading } from '../ui/heading.tsx'
import { Text } from '../ui/text.tsx'
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

const linkClassName =
  'text-zinc-950 underline decoration-zinc-950/50 data-hover:decoration-zinc-950'

function UserLink({ userDetails, harmful }: UserLinkProps) {
  const filterValue = harmful
    ? { label: 'Show Bad only', value: true }
    : { label: 'Show Good only', value: false }
  const label = harmful
    ? `${userDetails.harmful_changesets} Bad`
    : `${(userDetails.checked_changesets ?? 0) - (userDetails.harmful_changesets ?? 0)} Good`

  return (
    <RouterLink
      to="/"
      search={{
        filters: {
          uids: [{ label: userDetails.uid, value: userDetails.uid }],
          harmful: [filterValue],
          date__gte: [{ label: '', value: '' }],
        },
      }}
      className={linkClassName}
    >
      {label}
    </RouterLink>
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

  return (
    <div className="px-3 py-2">
      <MigrationAuditLegend />
      <MigrationAudit kind="duplicate" className="inline-block">
        <Subheading>User {userDetails.uid ? `/ ${userDetails.uid}` : null}</Subheading>
      </MigrationAudit>
      {userDetails.name ? (
        <div className="mt-2 flex flex-col items-center gap-2">
          <MigrationAudit kind="missing">
            <Avatar
              src={avatarSrc(userDetails.img)}
              initials={initials}
              alt={userDetails.name}
              className="size-24"
            />
          </MigrationAudit>
          <MigrationAudit kind="duplicate">
            <p className="text-center font-semibold text-zinc-700">{userDetails.name}</p>
          </MigrationAudit>
          <div className="text-center text-base/6 text-zinc-500 sm:text-sm/6">
            {registrationDate != null && (
              <MigrationAudit kind="duplicate" className="inline-block">
                Joined <RelativeTime datetime={registrationDate} />
              </MigrationAudit>
            )}
            {registrationDate != null ? ' | ' : null}
            {userDetails.count ? (
              <MigrationAudit kind="missing" className="inline-block">
                <RouterLink
                  to="/"
                  search={{
                    filters: {
                      uids: [{ label: userDetails.uid, value: userDetails.uid }],
                      date__gte: [{ label: '', value: '' }],
                    },
                  }}
                  className={linkClassName}
                >
                  {`${userDetails.count} edits`}
                </RouterLink>
              </MigrationAudit>
            ) : (
              <MigrationAudit kind="duplicate" className="inline-block">
                {`${userDetails.changesets_in_osmcha} edits registered on OSMCha`}
              </MigrationAudit>
            )}
          </div>
          <MigrationAudit kind="missing">
            <Text className="text-center">
              <UserLink userDetails={userDetails} harmful={true} />
              {' and '}
              <UserLink userDetails={userDetails} harmful={false} />
              {' changesets'}
            </Text>
          </MigrationAudit>
          <MigrationAudit kind="missing">
            <TrustWatchUser user={userDetails as { name: string; uid: number }} />
          </MigrationAudit>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-1">
            <MigrationAudit kind="missing" className="inline-flex">
              <RouterLink
                to="/"
                search={{
                  filters: {
                    users: [{ label: userDetails.name, value: userDetails.name }],
                    date__gte: [{ label: '', value: '' }],
                  },
                }}
                className="inline-flex min-h-11 cursor-pointer touch-manipulation items-center rounded-lg border border-zinc-950/10 px-3 text-sm font-semibold text-zinc-950 select-none hover:bg-zinc-950/2.5"
              >
                OSMCha
              </RouterLink>
            </MigrationAudit>
            <MigrationAudit kind="duplicate" className="inline-flex">
              <UserOSMLink userName={userDetails.name}>OSM</UserOSMLink>
            </MigrationAudit>
            <MigrationAudit kind="duplicate" className="inline-flex">
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
            </MigrationAudit>
            <MigrationAudit kind="missing" className="inline-flex">
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
            </MigrationAudit>
          </div>
          {whosThat.length > 1 && (
            <MigrationAudit kind="missing">
              <Text>
                Past usernames:{' '}
                {whosThat.slice(0, -1).map((name) => (
                  <em key={name} className="not-italic">
                    {name}{' '}
                  </em>
                ))}
              </Text>
            </MigrationAudit>
          )}
          {userDetails.description ? (
            <MigrationAudit kind="missing" className="w-full">
              <div className="user-description mt-2 w-full text-sm wrap-break-word [&_a]:text-blue-700 [&_a]:underline [&_h2]:font-semibold">
                <Markdown remarkPlugins={[remarkGfm]}>{userDetails.description}</Markdown>
              </div>
            </MigrationAudit>
          ) : null}
        </div>
      ) : (
        <div className="mt-2 flex flex-col items-center gap-3">
          <MigrationAudit kind="missing">
            <Avatar
              src={avatarSrc(userDetails.img)}
              initials={initials}
              alt=""
              className="size-24"
            />
          </MigrationAudit>
          <MigrationAudit kind="duplicate">
            <SignInButton text="Sign in to see the user details" />
          </MigrationAudit>
        </div>
      )}
    </div>
  )
}
