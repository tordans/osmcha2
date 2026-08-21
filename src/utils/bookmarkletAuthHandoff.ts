import { z } from 'zod'
import { parseTokenPaste } from './auth.ts'

export const BOOKMARKLET_SOURCE = 'osmcha2-bookmarklet'
export const AUTH_READY_TYPE = 'osmcha2-auth-ready'

export const ALLOWED_HANDOFF_ORIGINS = ['https://osmcha.org', 'https://www.osmcha.org'] as const

const ALLOWED_HANDOFF_ORIGIN_SET = new Set<string>(ALLOWED_HANDOFF_ORIGINS)

const bookmarkletAuthMessageSchema = z.object({
  source: z.literal(BOOKMARKLET_SOURCE),
  auth: z.string(),
})

const authReadyMessageSchema = z.object({
  type: z.literal(AUTH_READY_TYPE),
})

export function isAllowedHandoffOrigin(origin: string): boolean {
  return ALLOWED_HANDOFF_ORIGIN_SET.has(origin)
}

/**
 * Absolute entry URL for this deploy (origin + Vite `base`).
 * Pages: `https://tordans.github.io/osmcha2/`; local: `http://127.0.0.1:3000/`.
 */
export function appEntryUrl(
  origin: string = typeof window !== 'undefined' ? window.location.origin : '',
  base: string = typeof import.meta !== 'undefined' ? import.meta.env.BASE_URL : '/',
): string {
  const normalized = base.endsWith('/') ? base : `${base}/`
  if (normalized === '/') return `${origin}/`
  return `${origin}${normalized}`
}

/** Extract a DRF token from a bookmarklet postMessage payload, or null if invalid. */
export function parseBookmarkletAuthMessage(data: unknown): string | null {
  const parsed = bookmarkletAuthMessageSchema.safeParse(data)
  if (!parsed.success) return null
  return parseTokenPaste(parsed.data.auth)
}

export function isAuthReadyMessage(data: unknown): boolean {
  return authReadyMessageSchema.safeParse(data).success
}

export function authReadyPayload() {
  return { type: AUTH_READY_TYPE } as const
}

/**
 * Bookmarklet: on osmcha.org, open this app and post the `auth` localStorage blob.
 * `appUrl` is the full entry URL; `appOrigin` is the postMessage target origin.
 */
export function buildOpenSignedInBookmarklet(appUrl: string, appOrigin: string): string {
  const body = `(function(){var h=location.hostname;if(h!=='osmcha.org'&&h!=='www.osmcha.org'){alert('Run this bookmarklet on osmcha.org while signed in.');return;}var auth=localStorage.getItem('auth');if(!auth){alert('No OSMCha auth found. Sign in on osmcha.org first.');return;}var appUrl=${JSON.stringify(appUrl)};var appOrigin=${JSON.stringify(appOrigin)};var w=window.open(appUrl);if(!w){alert('Popup blocked. Allow popups for osmcha.org and try again.');return;}var sent=false;function send(){if(sent||w.closed)return;sent=true;w.postMessage({source:${JSON.stringify(BOOKMARKLET_SOURCE)},auth:auth},appOrigin);window.removeEventListener('message',onMsg);}function onMsg(e){if(e.origin!==appOrigin)return;if(e.data&&e.data.type===${JSON.stringify(AUTH_READY_TYPE)})send();}window.addEventListener('message',onMsg);setTimeout(send,3000);})();`
  return `javascript:${encodeURIComponent(body)}`
}

/** Bookmarklet: on osmcha.org, copy the `auth` localStorage JSON to the clipboard. */
export function buildCopyAuthBookmarklet(): string {
  const body = `(function(){var h=location.hostname;if(h!=='osmcha.org'&&h!=='www.osmcha.org'){alert('Run this bookmarklet on osmcha.org while signed in.');return;}var auth=localStorage.getItem('auth');if(!auth){alert('No OSMCha auth found. Sign in on osmcha.org first.');return;}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(auth).then(function(){alert('Copied OSMCha auth JSON. Paste it into osmcha2 and Save.');}).catch(function(){window.prompt('Copy this auth JSON:',auth);});}else{window.prompt('Copy this auth JSON:',auth);}})();`
  return `javascript:${encodeURIComponent(body)}`
}
