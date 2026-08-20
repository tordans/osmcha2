import { createTokenClass, MultiToken, registerPlugin, State, type Plugin } from 'linkifyjs'

// Official hashtag plugin, plus hyphens — OSM tags like #hotosm-project-2999.
const HashtagToken = createTokenClass('hashtag', {
  isLink: true,
})

const osmHashtag: Plugin = ({ scanner, parser }) => {
  const { POUND, UNDERSCORE, HYPHEN, FULLWIDTHMIDDLEDOT, ASCIINUMERICAL, ALPHANUMERICAL } =
    scanner.tokens
  const { alpha, numeric, alphanumeric, emoji } = scanner.tokens.groups

  const Hash = parser.start.tt(POUND)
  const HashPrefix = Hash.tt(UNDERSCORE)
  // linkify's State emits a token class; its public types model an instance.
  const Hashtag = new State(HashtagToken as unknown as MultiToken)
  Hash.tt(ASCIINUMERICAL, Hashtag)
  Hash.tt(ALPHANUMERICAL, Hashtag)
  Hash.ta(numeric, HashPrefix)
  Hash.ta(alpha, Hashtag)
  Hash.ta(emoji, Hashtag)
  Hash.ta(FULLWIDTHMIDDLEDOT, Hashtag)
  HashPrefix.tt(ASCIINUMERICAL, Hashtag)
  HashPrefix.tt(ALPHANUMERICAL, Hashtag)
  HashPrefix.ta(alpha, Hashtag)
  HashPrefix.ta(emoji, Hashtag)
  HashPrefix.ta(FULLWIDTHMIDDLEDOT, Hashtag)
  HashPrefix.ta(numeric, HashPrefix)
  HashPrefix.tt(UNDERSCORE, HashPrefix)
  HashPrefix.tt(HYPHEN, HashPrefix)
  Hashtag.ta(alphanumeric, Hashtag)
  Hashtag.ta(emoji, Hashtag)
  Hashtag.tt(FULLWIDTHMIDDLEDOT, Hashtag)
  Hashtag.tt(UNDERSCORE, Hashtag)
  Hashtag.tt(HYPHEN, Hashtag)
}

registerPlugin('hashtag', osmHashtag)
