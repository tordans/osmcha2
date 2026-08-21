import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { z } from 'zod'
import { useAuthStore } from '../stores/authStore.ts'
import { OSMCHA_ORG_AUTH_CONSOLE_SNIPPET, parseTokenPaste } from '../utils/auth.ts'
import {
  appEntryUrl,
  buildCopyAuthBookmarklet,
  buildOpenSignedInBookmarklet,
} from '../utils/bookmarkletAuthHandoff.ts'
import { Button } from './ui/button.tsx'
import { ErrorMessage, Field } from './ui/fieldset.tsx'
import { Subheading } from './ui/heading.tsx'
import { CheckIcon, ClipboardIcon } from './ui/icons.ts'
import { Input } from './ui/input.tsx'
import { Code, Strong, Text, TextLink } from './ui/text.tsx'
import { Textarea } from './ui/textarea.tsx'

const tokenSchema = z.object({
  token: z
    .string()
    .trim()
    .min(1, 'Paste a token')
    .refine((value) => parseTokenPaste(value) !== null, {
      message: 'Could not find a token in that paste',
    }),
})

function formatFieldErrors(errors: unknown[]) {
  return errors.map((error) => (typeof error === 'string' ? error : String(error))).join(', ')
}

interface TokenImportProps {
  compact?: boolean
}

export function TokenImport({ compact = false }: TokenImportProps) {
  const form = useForm({
    defaultValues: { token: '' },
    validators: {
      onSubmit: tokenSchema,
    },
    onSubmit: ({ value }) => {
      const token = parseTokenPaste(value.token)
      if (!token) return
      useAuthStore.getState().setToken(token)
      form.reset()
    },
  })

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
      className={compact ? 'flex items-center gap-2' : 'flex w-full max-w-md flex-col gap-4'}
    >
      {!compact && <TokenImportHelp />}
      <div className={compact ? 'flex items-center gap-2' : 'flex flex-col gap-2'}>
        <form.Field name="token">
          {(field) =>
            compact ? (
              <Input
                type="password"
                name="osmcha-api-token"
                placeholder="API token"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                aria-label="OSMCha API token"
                className="w-44"
              />
            ) : (
              <Field>
                <Textarea
                  name="osmcha-api-token"
                  rows={3}
                  placeholder='{"state":{"token":"…"},"version":0}'
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-label="OSMCha API token"
                  resizable={false}
                  className="font-mono text-sm"
                />
                {field.state.meta.errors.length > 0 ? (
                  <ErrorMessage>{formatFieldErrors(field.state.meta.errors)}</ErrorMessage>
                ) : null}
              </Field>
            )
          }
        </form.Field>
        <form.Subscribe selector={(state) => state.values.token}>
          {(token) => (
            <Button
              type="submit"
              disabled={!token.trim()}
              className="min-h-11 cursor-pointer touch-manipulation select-none"
            >
              Save
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}

function TokenImportHelp() {
  const entryUrl = appEntryUrl()
  const openHref = buildOpenSignedInBookmarklet(entryUrl, window.location.origin)
  const copyHref = buildCopyAuthBookmarklet()

  return (
    <div className="flex flex-col gap-4 text-left">
      <Text>
        This site cannot complete OpenStreetMap sign-in. Reuse the API token osmcha.org already
        issued you — same account, reviews, and saved filters. A raw token, <Code>Token …</Code>{' '}
        from Account → API key, or the whole <Code>{'{"state":{"token":"…"}}'}</Code> value all
        work.
      </Text>

      <div>
        <Subheading level={3}>Bookmarklet (fastest)</Subheading>
        <Text className="mt-1">
          Drag a link onto your bookmarks bar. On{' '}
          <TextLink href="https://osmcha.org" target="_blank" rel="noreferrer">
            osmcha.org
          </TextLink>{' '}
          (signed in), click the bookmark. Use <Strong>only</Strong> these links — only on
          osmcha.org. A fake bookmarklet from another site can steal your token.
        </Text>
        <Text className="mt-1">
          Chrome often blocks clicking <Code>javascript:</Code> links on this page; dragging to the
          bookmarks bar still works. osmcha.org CSP can block some bookmarklets — then use the steps
          below.
        </Text>
        <ul className="mt-3 flex flex-col gap-3">
          <li className="flex flex-col gap-1.5 rounded-lg border border-zinc-950/10 bg-white p-3">
            <Strong>Open this app signed in</Strong>
            <Text>
              Opens {entryUrl} and signs you in via a one-time message (token never goes in the
              URL).
            </Text>
            <BookmarkletActions href={openHref} label="Open osmcha2 signed in" />
          </li>
          <li className="flex flex-col gap-1.5 rounded-lg border border-zinc-950/10 bg-white p-3">
            <Strong>Copy auth JSON</Strong>
            <Text>Copies the auth blob to the clipboard — paste below and Save.</Text>
            <BookmarkletActions href={copyHref} label="Copy auth JSON" />
          </li>
        </ul>
      </div>

      <div>
        <Subheading level={3}>Chrome: copy from Local Storage</Subheading>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-base/6 text-zinc-500 sm:text-sm/6">
          <li>
            Open{' '}
            <TextLink href="https://osmcha.org" target="_blank" rel="noreferrer">
              osmcha.org
            </TextLink>{' '}
            and sign in.
          </li>
          <li>
            Open DevTools: <Code>⌥⌘I</Code> (Mac) or <Code>F12</Code> (Windows/Linux). Or menu →
            More tools → Developer tools.
          </li>
          <li>
            Open the <Strong>Application</Strong> tab. If it is hidden, click the <Code>»</Code>{' '}
            overflow on the DevTools tab bar.
          </li>
          <li>
            Left sidebar: Storage → Local Storage → <Code>https://osmcha.org</Code>.
          </li>
          <li>
            Click the <Code>auth</Code> key.
          </li>
          <li>
            Copy the <Strong>Value</Strong> — it looks like{' '}
            <Code className="break-all">{'{"state":{"token":"…"},"version":0}'}</Code>. Double-click
            the value cell, then copy.
          </li>
          <li>Paste it below and Save.</li>
        </ol>
      </div>

      <div>
        <Subheading level={3}>Or Console (faster)</Subheading>
        <Text className="mt-1">
          On osmcha.org, open DevTools → Console, paste this, press Enter, then paste here. Easier,
          but it runs as code in that tab.
        </Text>
        <CopyableSnippet text={OSMCHA_ORG_AUTH_CONSOLE_SNIPPET} ariaLabel="Copy console snippet" />
      </div>
    </div>
  )
}

function BookmarkletActions({ href, label }: { href: string; label: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={href}
        className="inline-flex min-h-11 cursor-grab touch-manipulation items-center justify-center rounded-lg border border-zinc-950/10 bg-zinc-50 px-3 text-sm/6 font-semibold text-zinc-950 select-none hover:bg-zinc-950/2.5 active:cursor-grabbing"
        onClick={(event) => {
          // Prefer drag-to-bookmarks; clicking javascript: is often blocked.
          event.preventDefault()
        }}
      >
        {label}
      </a>
      <CopyButton text={href} ariaLabel={`Copy ${label} bookmarklet`} copiedLabel="Copied code" />
    </div>
  )
}

function CopyableSnippet({ text, ariaLabel }: { text: string; ariaLabel: string }) {
  return (
    <div className="mt-2 flex items-start gap-2">
      <pre className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-zinc-950/10 bg-white px-3 py-2 text-sm">
        <code>{text}</code>
      </pre>
      <CopyButton text={text} ariaLabel={ariaLabel} />
    </div>
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

  return (
    <Button
      plain
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
