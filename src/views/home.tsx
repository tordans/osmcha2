import { Heading } from '../components/ui/heading.tsx'
import { Link } from '../components/ui/link.tsx'
import { Text } from '../components/ui/text.tsx'
import { appVersion, isLocal } from '../config/index.ts'

const footerLinkClassName =
  'inline-flex min-h-11 items-center text-base/6 text-zinc-500 underline decoration-zinc-950/20 sm:text-sm/6 hover-fine:decoration-zinc-950/50'

export function Home() {
  return (
    <div className="flex min-h-0 flex-1 flex-col px-[max(1.5rem,env(safe-area-inset-left))] pt-[max(1.5rem,env(safe-area-inset-top))] pr-[max(1.5rem,env(safe-area-inset-right))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        <Heading className="text-center">Select a changeset</Heading>
      </div>
      <footer className="flex flex-wrap items-center justify-center gap-x-3">
        <Text>
          v{appVersion}
          {isLocal ? ' Local' : ''}
        </Text>
        <Link href="/about" className={footerLinkClassName}>
          Guide
        </Link>
        <Link
          href="https://github.com/osmcha/osmcha-frontend/blob/master/CONTRIBUTING.md"
          target="_blank"
          rel="noreferrer"
          className={footerLinkClassName}
        >
          GitHub
        </Link>
        <Link
          href="https://openstreetmap.app.neoncrm.com/forms/osmcha"
          target="_blank"
          rel="noreferrer"
          className={footerLinkClassName}
        >
          Donate
        </Link>
      </footer>
    </div>
  )
}
