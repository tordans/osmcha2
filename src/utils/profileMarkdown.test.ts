import { describe, expect, test } from 'vitest'
import { htmlLinksToMarkdown, prepareProfileMarkdown } from './profileMarkdown.ts'

describe('htmlLinksToMarkdown', () => {
  test('turns a rel="me" Mastodon link into a Markdown link', () => {
    expect(
      htmlLinksToMarkdown(
        'Find me on <a rel="me" href="https://mastodon.social/@tordans">Mastodon</a>.',
      ),
    ).toBe('Find me on [Mastodon](<https://mastodon.social/@tordans>).')
  })

  test('handles single quotes, unquoted hrefs, nested tags and entities', () => {
    expect(
      htmlLinksToMarkdown("<a href='https://a.example/?x=1&amp;y=2'><b>A</b> &amp; B</a>"),
    ).toBe('[A & B](<https://a.example/?x=1&y=2>)')
    expect(htmlLinksToMarkdown('<A HREF=https://b.example>b</A>')).toBe('[b](<https://b.example>)')
  })

  test('uses the URL when the link has no text and escapes brackets in the label', () => {
    expect(htmlLinksToMarkdown('<a href="https://c.example"></a>')).toBe(
      '[https://c.example](<https://c.example>)',
    )
    expect(htmlLinksToMarkdown('<a href="https://d.example">[d]</a>')).toBe(
      '[\\[d\\]](<https://d.example>)',
    )
  })

  test('keeps only the text of unsafe or missing links', () => {
    expect(htmlLinksToMarkdown('<a href="javascript:alert(1)">click</a>')).toBe('click')
    expect(htmlLinksToMarkdown('<a name="x">anchor</a>')).toBe('anchor')
  })

  test('leaves Markdown and other text alone', () => {
    const text = '## Hi\n\n[OSM](https://osm.org) and a < b'
    expect(htmlLinksToMarkdown(text)).toBe(text)
  })
})

describe('prepareProfileMarkdown', () => {
  test('drops kramdown comments, attribute lists and HTML comments', () => {
    expect(
      prepareProfileMarkdown(
        'geogeek {::comment} Anzeige {:/comment} | <!-- hidden -->[OSM][o]{: .x}',
      ),
    ).toBe('geogeek  | [OSM][o]')
    expect(prepareProfileMarkdown('a{::comment /}b {::options parse_block_html="true" /}')).toBe(
      'ab ',
    )
  })

  test('removes multi-line comments', () => {
    expect(
      prepareProfileMarkdown('keep\n{::comment}\nline 1\nline 2\n{:/comment}\nalso keep'),
    ).toBe('keep\n\nalso keep')
  })

  test('puts reference definitions back at the start of a line', () => {
    expect(
      prepareProfileMarkdown(
        '{::comment} Linkliste {:/comment} [wiki]: https://wiki.example "Wiki" [forum]: https://forum.example',
      ),
    ).toBe('\n[wiki]: https://wiki.example "Wiki"\n[forum]: https://forum.example')
  })

  test('still converts HTML links', () => {
    expect(prepareProfileMarkdown('<a rel="me" href="https://m.example/@x">M</a>')).toBe(
      '[M](<https://m.example/@x>)',
    )
  })
})
