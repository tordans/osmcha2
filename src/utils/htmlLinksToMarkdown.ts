const ANCHOR = /<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi
const HREF = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i
const SAFE_URL = /^(?:https?:|mailto:)/i

function decodeEntities(text: string) {
  return text
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')
}

/**
 * OSM profile descriptions are Markdown, but people also paste plain `<a>` tags
 * (e.g. `<a rel="me" href="https://mastodon.social/@x">Mastodon</a>`). The Markdown
 * renderer drops raw HTML, so turn those anchors into Markdown links first. Only
 * http(s) and mailto links are kept; anything else becomes its plain text.
 */
export function htmlLinksToMarkdown(text: string) {
  return text.replace(ANCHOR, (_match, attributes: string, inner: string) => {
    const label = decodeEntities(inner.replace(/<[^>]*>/g, '')).trim()
    const hrefMatch = HREF.exec(attributes)
    const href = decodeEntities(hrefMatch?.[1] ?? hrefMatch?.[2] ?? hrefMatch?.[3] ?? '').trim()
    if (!SAFE_URL.test(href)) return label
    const escapedLabel = (label || href).replace(/([[\]\\])/g, '\\$1')
    return `[${escapedLabel}](<${href.replace(/[<>]/g, encodeURIComponent)}>)`
  })
}
