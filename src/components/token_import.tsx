import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { getAuthActions } from '../stores/auth-store.ts'
import { parseTokenPaste } from '../utils/auth.ts'
import { appEntryUrl, buildOpenSignedInBookmarklet } from '../utils/bookmarkletAuthHandoff.ts'
import { bookmarksBarShortcut, inspectorOs } from '../utils/inspectorOs.ts'
import { Button } from './ui/button.tsx'
import { ErrorMessage, Field } from './ui/fieldset.tsx'
import { Heading } from './ui/heading.tsx'
import { CheckIcon, ChevronDownIcon, ClipboardIcon } from './ui/icons.ts'
import { Input } from './ui/input.tsx'
import { Code, Strong, Text } from './ui/text.tsx'

const OSMCHA_ORG_URL = 'https://osmcha.org'
/** osmcha.org's account page shows the API key with a Copy button. */
const OSMCHA_ORG_ACCOUNT_URL = 'https://osmcha.org/user'

interface TokenImportProps {
  compact?: boolean
  /** Fill the local token-UI preview overlay. */
  layout?: 'stack' | 'sheet'
}

export function TokenImport({ compact = false, layout = 'stack' }: TokenImportProps) {
  if (compact) return <TokenPasteField />

  const help = <TokenImportHelp />

  if (layout === 'sheet') {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{help}</div>
      </div>
    )
  }

  return <div className="flex w-full max-w-md flex-col gap-5 text-left">{help}</div>
}

function TokenPasteField() {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  function signIn(raw: string) {
    const token = parseTokenPaste(raw)
    if (!token) {
      setError('Could not find a token. Paste the API key from osmcha.org/user.')
      return
    }
    setError(null)
    getAuthActions().setToken(token)
  }

  return (
    <form
      className="flex min-w-0 flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        signIn(value)
      }}
    >
      {/* Field gives ErrorMessage its Headless context; without it the error crashes the page. */}
      <Field>
        <Input
          type="text"
          name="osmcha-api-token"
          placeholder="Token …"
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            setError(null)
          }}
          onPaste={(event: React.ClipboardEvent<HTMLInputElement>) => {
            // Sign in straight away when the clipboard holds a token. Otherwise let the
            // browser paste as usual; on iOS Safari a paste could land in the error branch.
            const pasted = event.clipboardData.getData('text/plain')
            if (!parseTokenPaste(pasted)) return
            event.preventDefault()
            signIn(pasted)
          }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="OSMCha API key"
          aria-invalid={error ? true : undefined}
          className="font-mono"
        />
        {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      </Field>
      <Button type="submit" className="min-h-11 self-start">
        Sign in
      </Button>
    </form>
  )
}

function TokenImportHelp() {
  const os = inspectorOs()
  const bookmarksKeys = bookmarksBarShortcut(os)
  const entryUrl = appEntryUrl()
  const openHref = buildOpenSignedInBookmarklet(entryUrl, window.location.origin)

  return (
    <div className="flex flex-col gap-4 text-left">
      <Heading level={2}>Sign in with your OSMCha API key</Heading>
      <Text>
        This site cannot complete OpenStreetMap sign-in yet. osmcha.org shows an API key for your
        account; paste it here. Reviews and saved filters come with it.
      </Text>

      <StepList>
        <Step n={1}>
          <Strong>Open your account page on osmcha.org</Strong>
          <Text className="mt-1">Sign in there with OpenStreetMap if you are asked.</Text>
          <div className="mt-2">
            <Button href={OSMCHA_ORG_ACCOUNT_URL} target="_blank" rel="noreferrer" outline>
              Open osmcha.org/user
            </Button>
          </div>
        </Step>
        <Step n={2}>
          <Strong>Copy the API key</Strong>
          <Text className="mt-1">
            Next to <Strong>API key</Strong>, use the copy button. It copies <Code>Token …</Code>;
            paste it as it is.
          </Text>
        </Step>
        <Step n={3}>
          <Strong>Paste it here</Strong>
          <div className="mt-2">
            <TokenPasteField />
          </div>
        </Step>
      </StepList>

      <MethodSection title="On a computer: sign in with one click">
        <Text>
          Optional one-time setup: drag a link onto your bookmarks bar. Then, on osmcha.org while
          signed in, click that bookmark. It opens this app already signed in. Use only this link; a
          bookmarklet from anywhere else can steal your token.
        </Text>
        <StepList>
          <Step n={1}>
            <Strong>Show the bookmarks bar</Strong>
            <Text className="mt-1">
              Press <Shortcut keys={bookmarksKeys.keys} ariaLabel={bookmarksKeys.ariaLabel} />.
            </Text>
          </Step>
          <Step n={2}>
            <Strong>Drag this onto the bookmarks bar</Strong>
            <Text className="mt-1">
              Grab the link and drop it on the bar. Clicking it here does nothing.
            </Text>
            <div className="mt-2">
              <BookmarkletDragLink href={openHref} label="OSMCha2 sign-in" />
            </div>
            <Text className="mt-3">
              If drag does not work, copy the bookmarklet and paste it as the URL of a new bookmark.
            </Text>
            <div className="mt-2">
              <CopyButton
                text={openHref}
                ariaLabel="Copy bookmarklet URL"
                copiedLabel="Copied bookmarklet"
              />
            </div>
          </Step>
          <Step n={3}>
            <Strong>On osmcha.org, click OSMCha2 sign-in</Strong>
            <Text className="mt-1">Sign in there first if needed. Allow the popup if asked.</Text>
            <div className="mt-2">
              <Button href={OSMCHA_ORG_URL} target="_blank" rel="noreferrer" outline>
                Open osmcha.org
              </Button>
            </div>
          </Step>
        </StepList>
      </MethodSection>
    </div>
  )
}

function MethodSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-lg border border-zinc-950/10 bg-white">
      <summary className="flex min-h-11 cursor-pointer touch-manipulation list-none items-center justify-between gap-2 px-3 py-2 text-sm font-semibold text-zinc-950 select-none marker:content-none active:bg-zinc-950/5 [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDownIcon className="size-4 shrink-0 text-zinc-500 transition group-open:rotate-180" />
      </summary>
      <div className="flex flex-col gap-3 border-t border-zinc-950/10 px-3 py-3">{children}</div>
    </details>
  )
}

function StepList({ children }: { children: React.ReactNode }) {
  return <ol className="flex flex-col gap-4">{children}</ol>
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-xs font-semibold text-white">
        {n}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  )
}

function Shortcut({ keys, ariaLabel }: { keys: string[]; ariaLabel: string }) {
  return (
    <span className="inline-flex items-center gap-1 align-middle" aria-label={ariaLabel}>
      {keys.map((key) => (
        <kbd
          key={key}
          className="inline-flex min-w-[1.5rem] items-center justify-center rounded border border-zinc-950/15 bg-zinc-50 px-1.5 py-0.5 font-sans text-xs font-semibold text-zinc-950"
        >
          {key}
        </kbd>
      ))}
    </span>
  )
}

function BookmarkletDragLink({ href, label }: { href: string; label: string }) {
  const nodeRef = useRef<HTMLAnchorElement>(null)

  useLayoutEffect(
    function assignBookmarkletHref() {
      // React 19 strips `javascript:` from JSX `href` (status bar shows a thrown Error).
      // Set it on the DOM so drag-to-bookmarks still gets a real bookmarklet.
      nodeRef.current?.setAttribute('href', href)
    },
    [href],
  )

  return (
    <a
      ref={(node) => {
        nodeRef.current = node
        node?.setAttribute('href', href)
      }}
      href="https://osmcha.org/"
      draggable
      title="Drag to your bookmarks bar"
      className="inline-flex min-h-11 cursor-grab touch-manipulation items-center justify-center rounded-lg border border-dashed border-zinc-950/20 bg-zinc-50 px-3 text-sm/6 font-semibold text-zinc-950 select-none hover:bg-zinc-950/2.5 active:cursor-grabbing"
      onClick={(event) => {
        event.preventDefault()
      }}
      onDragStart={(event) => {
        event.dataTransfer.setData('text/uri-list', href)
        event.dataTransfer.setData('text/plain', href)
        event.dataTransfer.effectAllowed = 'copyLink'
      }}
    >
      {label}
    </a>
  )
}

function CopyButton({
  text,
  ariaLabel,
  copiedLabel = 'Copied',
}: {
  text: string
  ariaLabel: string
  copiedLabel?: string
}) {
  const [copied, setCopied] = useState(false)

  useEffect(
    function resetCopiedLabel() {
      if (!copied) return
      const timeoutId = window.setTimeout(() => {
        setCopied(false)
      }, 2000)
      return function clearCopiedReset() {
        window.clearTimeout(timeoutId)
      }
    },
    [copied],
  )

  return (
    <Button
      type="button"
      className="min-h-11 shrink-0"
      aria-label={ariaLabel}
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true)
        })
      }}
    >
      {copied ? <CheckIcon data-slot="icon" /> : <ClipboardIcon data-slot="icon" />}
      {copied ? copiedLabel : 'Copy'}
    </Button>
  )
}
