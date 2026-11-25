import { useAuth } from '../../hooks/useAuth.ts'
import { BrandMark } from '../../layout/Logo.tsx'
import { ApiError, RequestTooLargeError } from '../../network/request.ts'
import { isOsmOAuthHost } from '../../utils/auth.ts'
import { elementInViewport } from '../../utils/element_in_view.ts'
import { SignInButton } from '../changeset/sign_in_button.tsx'
import { Loading } from '../loading.tsx'
import { TokenImport } from '../token_import.tsx'
import { Button } from '../ui/button.tsx'
import { Row } from './row.tsx'

type CurrentPage = {
  features: Array<{
    id: number
    properties: any
    geometry?: unknown
  }>
  count: number
}

type Props = {
  currentPage?: CurrentPage
  activeChangesetId: number | null
  pageIndex: number
  loading?: boolean
  location?: string
  error?: unknown
  onRetry?: () => void
}

/** What went wrong, in words for the reviewer. Too large a filter is not "no matches". */
function listErrorText(error: unknown): { title: string; detail: string; canRetry: boolean } {
  if (error instanceof RequestTooLargeError) {
    return {
      title: 'These filters are too large for OSMCha.',
      detail:
        'Usually the location has too many points. Use Edit, then pick the place again or draw a simpler area.',
      canRetry: false,
    }
  }
  if (error instanceof ApiError && error.status === 429) {
    return {
      title: 'OSMCha is getting too many requests.',
      detail: 'Wait a minute, then try again.',
      canRetry: true,
    }
  }
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return {
      title: 'OSMCha could not run these filters.',
      detail: `${error.message} (${error.status}). A very detailed location is a common cause: use Edit and pick it again.`,
      canRetry: false,
    }
  }
  return {
    title: 'Changesets could not be loaded.',
    detail: error instanceof Error ? error.message : 'Unknown error.',
    canRetry: true,
  }
}

function ListError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { title, detail, canRetry } = listErrorText(error)
  return (
    <div
      role="alert"
      className="flex flex-1 flex-col items-center gap-2 bg-white px-4 py-9 text-center"
    >
      <p className="font-medium text-zinc-900">{title}</p>
      <p className="text-sm text-zinc-600">{detail}</p>
      {canRetry && onRetry ? (
        <Button type="button" outline className="mt-2" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}

function List({ currentPage, activeChangesetId, loading, location, error, onRetry }: Props) {
  const { token } = useAuth()
  const localOAuth = isOsmOAuthHost()
  function scrollActiveRowIntoView(r: HTMLElement | null) {
    if (!r) return
    if (!elementInViewport(r)) {
      r.scrollIntoView({ block: 'end', behavior: 'smooth' })
    }
  }

  if (loading) {
    return <Loading />
  }

  if (!token && location && ['/about', '/filters', '/user', '/'].includes(location)) {
    return (
      <div className="flex flex-1 flex-col items-center overflow-y-auto bg-white px-4 py-9">
        <BrandMark className="text-xl font-semibold text-zinc-600" />
        <div className="mt-9 flex w-full justify-center">
          {localOAuth ? <SignInButton text="Sign in with OpenStreetMap" /> : <TokenImport />}
        </div>
      </div>
    )
  }

  if (error != null && !currentPage) {
    return <ListError error={error} onRetry={onRetry} />
  }

  const features = currentPage?.features

  if (features && features.length === 0) {
    return (
      <p className="flex flex-1 items-start justify-center bg-white px-4 py-9 text-center text-zinc-500">
        No changesets match these filters.
      </p>
    )
  }

  return (
    <ul
      aria-label="Changesets"
      // White even when the phone is in dark mode; the rows have no background of their own.
      className="flex min-h-0 flex-1 flex-col divide-y divide-zinc-100 bg-white"
    >
      {features?.map((f) => (
        <Row
          active={f.id === activeChangesetId}
          properties={f.properties}
          changesetId={f.id}
          geometry={f.geometry}
          data={f}
          inputRef={f.id === activeChangesetId ? scrollActiveRowIntoView : undefined}
          key={f.id}
        />
      ))}
    </ul>
  )
}

export { List }
