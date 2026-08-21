import { useRef } from 'react'
import { useAuth } from '../../hooks/useAuth.ts'
import { useOsmOAuthAvailable } from '../../hooks/useOsmOAuthAvailable.ts'
import { elementInViewport } from '../../utils/element_in_view.ts'
import { SignInButton } from '../changeset/sign_in_button.tsx'
import { Loading } from '../loading.tsx'
import { TokenImport } from '../token_import.tsx'
import { GlobeAltIcon } from '../ui/icons.ts'
import { Row } from './row.tsx'

type CurrentPage = {
  features: Array<{
    id: number
    properties: any
  }>
  count: number
}

type Props = {
  currentPage?: CurrentPage
  activeChangesetId: number | null
  pageIndex: number
  loading?: boolean
  location?: string
}

function List({ currentPage, activeChangesetId, loading, location }: Props) {
  const { token } = useAuth()
  const localOAuth = useOsmOAuthAvailable()
  const activeRef = useRef<HTMLElement | null>(null)

  function handleScroll(r: HTMLElement | null) {
    if (!r) return
    activeRef.current = r
    if (!elementInViewport(r)) {
      r.scrollIntoView({ block: 'end', behavior: 'smooth' })
    }
  }

  if (loading) {
    return <Loading />
  }

  if (!token && location && ['/about', '/filters', '/user', '/'].includes(location)) {
    return (
      <div className="flex flex-1 flex-col items-center overflow-y-auto px-4 py-9">
        <GlobeAltIcon variant="fill" className="size-14 text-zinc-400" />
        <div className="mt-9 flex w-full justify-center">
          {localOAuth ? <SignInButton text="Sign in with OpenStreetMap" /> : <TokenImport />}
        </div>
      </div>
    )
  }

  const features = currentPage?.features

  return (
    <ul className="flex min-h-0 flex-1 flex-col divide-y divide-zinc-100">
      {features?.map((f) => (
        <Row
          active={f.id === activeChangesetId}
          properties={f.properties}
          changesetId={f.id}
          data={f}
          inputRef={f.id === activeChangesetId ? handleScroll : undefined}
          key={f.id}
        />
      ))}
    </ul>
  )
}

export { List }
