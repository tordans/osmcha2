import { describe, expect, test } from 'vitest'
import {
  composeDiscussionPost,
  noteSeeUrl,
  parseDiscussionNotes,
  seeLabel,
  type ComposeNote,
  type NoteTarget,
} from './discussionNotes.ts'

const ORIGIN = 'https://osmcha.org'
const CHANGESET_ID = 999

const parse = (text: string, linkHosts?: readonly string[]) =>
  parseDiscussionNotes(text, {
    changesetId: CHANGESET_ID,
    ...(linkHosts ? { linkHosts } : {}),
  })

const compose = (input: { intro?: string; notes?: ComposeNote[] }) =>
  composeDiscussionPost({ changesetId: CHANGESET_ID, origin: ORIGIN, ...input })

const pin = { lat: 52.52014, lng: 13.40521 }

describe('seeLabel', () => {
  test('object, tag, pin-only, object+pin, and tag+pin', () => {
    expect(seeLabel({ ref: { type: 'way', id: 123 } })).toBe('`way/123`')
    expect(seeLabel({ ref: { type: 'way', id: 123, key: 'highway' } })).toBe(
      '`way/123` > `highway`',
    )
    expect(seeLabel({ pin })).toBe('📍')
    expect(seeLabel({ ref: { type: 'way', id: 123 }, pin })).toBe('📍 `way/123`')
    expect(seeLabel({ ref: { type: 'way', id: 123, key: 'highway' }, pin })).toBe(
      '📍 `way/123` > `highway`',
    )
  })
})

describe('seeLabel for a group', () => {
  test('names the first member and how many more the group has', () => {
    expect(seeLabel({ ref: { type: 'node', id: 14331471295, key: 'man_made' }, group: 2 })).toBe(
      '`node/14331471295` > `man_made` + 1 more',
    )
    expect(seeLabel({ ref: { type: 'node', id: 1, key: 'man_made' }, group: 873, pin })).toBe(
      '📍 `node/1` > `man_made` + 872 more',
    )
  })

  test('ignores a group of one, one without a tag key, and one that is not a size', () => {
    expect(seeLabel({ ref: { type: 'node', id: 1, key: 'a' }, group: 1 })).toBe('`node/1` > `a`')
    expect(seeLabel({ ref: { type: 'node', id: 1 }, group: 5 })).toBe('`node/1`')
    expect(seeLabel({ ref: { type: 'node', id: 1, key: 'a' }, group: 2.5 })).toBe('`node/1` > `a`')
  })
})

describe('noteSeeUrl', () => {
  test('omits absent query keys and strips a trailing origin slash', () => {
    expect(
      noteSeeUrl({
        origin: `${ORIGIN}/`,
        changesetId: CHANGESET_ID,
        target: { ref: { type: 'way', id: 123 } },
      }),
    ).toBe(`${ORIGIN}/changesets/${CHANGESET_ID}?ref=way/123`)
    expect(noteSeeUrl({ origin: ORIGIN, changesetId: CHANGESET_ID, target: { pin } })).toBe(
      `${ORIGIN}/changesets/${CHANGESET_ID}?pin=52.52014,13.40521`,
    )
    expect(
      noteSeeUrl({
        origin: ORIGIN,
        changesetId: CHANGESET_ID,
        target: { ref: { type: 'way', id: 123, key: 'highway' }, pin },
      }),
    ).toBe(`${ORIGIN}/changesets/${CHANGESET_ID}?ref=way/123/highway&pin=52.52014,13.40521`)
  })
})

describe('parseDiscussionNotes', () => {
  test('parses intro plus object, tag, pin-only, and tag-with-pin groups', () => {
    const text = `Thanks for the mapping.

See \`way/123\` ${ORIGIN}/changesets/${CHANGESET_ID}?ref=way/123
The classification looks wrong for this residential street.

See \`way/123\` > \`highway\` ${ORIGIN}/changesets/${CHANGESET_ID}?ref=way/123/highway
This looks like a path, not residential.

See 📍 ${ORIGIN}/changesets/${CHANGESET_ID}?pin=52.52014,13.40521
The crossing is missing here.

See 📍 \`way/123\` > \`addr:street\` ${ORIGIN}/changesets/${CHANGESET_ID}?ref=way/123/addr:street&pin=52.52014,13.40521&utm=1
Same tag, and a pin where I think the geometry should go.
`
    expect(parse(text)).toEqual({
      intro: 'Thanks for the mapping.',
      notes: [
        {
          ref: { type: 'way', id: 123 },
          body: 'The classification looks wrong for this residential street.',
        },
        {
          ref: { type: 'way', id: 123, key: 'highway' },
          body: 'This looks like a path, not residential.',
        },
        {
          pin,
          body: 'The crossing is missing here.',
        },
        {
          ref: { type: 'way', id: 123, key: 'addr:street' },
          pin,
          body: 'Same tag, and a pin where I think the geometry should go.',
        },
      ],
    })
  })

  test('parses See plus URL alone when the label is omitted', () => {
    expect(parse(`See ${ORIGIN}/changesets/${CHANGESET_ID}?ref=way/123\nLooks wrong.`)).toEqual({
      intro: '',
      notes: [{ ref: { type: 'way', id: 123 }, body: 'Looks wrong.' }],
    })
  })

  test('accepts a listed host and ignores an unknown host', () => {
    const listed = parse(`See ${ORIGIN}/changesets/${CHANGESET_ID}?ref=way/1\nOk`)
    expect(listed.notes).toEqual([{ ref: { type: 'way', id: 1 }, body: 'Ok' }])

    const unknown = parse(
      `See https://evil.example/changesets/${CHANGESET_ID}?ref=way/1\nThis stays intro.`,
    )
    expect(unknown).toEqual({
      intro: `See https://evil.example/changesets/${CHANGESET_ID}?ref=way/1\nThis stays intro.`,
      notes: [],
    })
  })

  test('treats www as a distinct host: listed only when the allowlist says so', () => {
    const wwwOsmcha = parse(
      `See https://www.osmcha.org/changesets/${CHANGESET_ID}?ref=way/1\nWww is listed.`,
    )
    expect(wwwOsmcha.notes).toEqual([{ ref: { type: 'way', id: 1 }, body: 'Www is listed.' }])

    const wwwNotListed = parse(
      `Intro stays.\nSee https://www.example.com/changesets/${CHANGESET_ID}?ref=way/1\nNot a header.`,
      ['example.com'],
    )
    expect(wwwNotListed).toEqual({
      intro: `Intro stays.\nSee https://www.example.com/changesets/${CHANGESET_ID}?ref=way/1\nNot a header.`,
      notes: [],
    })
  })

  test('does not treat Django evaluation footers as See headers', () => {
    const text = `Looks good.

#REVIEWED_GOOD #OSMCHA
Published using OSMCha`
    expect(parse(text)).toEqual({ intro: text, notes: [] })
  })

  test('does not attach our own See reference footer', () => {
    const text = `Just a changeset-level remark.

See ${ORIGIN}/changesets/${CHANGESET_ID}`
    expect(parse(text)).toEqual({ intro: 'Just a changeset-level remark.', notes: [] })
  })

  test('ignores a See pointing at a different changeset', () => {
    const text = `See ${ORIGIN}/changesets/888?ref=way/123\nWrong changeset stays intro.`
    expect(parse(text)).toEqual({ intro: text, notes: [] })
  })

  test('ignores a URL that is not on a See line', () => {
    const text = `Look at ${ORIGIN}/changesets/${CHANGESET_ID}?ref=way/123 in prose.`
    expect(parse(text)).toEqual({ intro: text, notes: [] })
  })

  test('skips an invalid ref group without throwing and keeps later notes', () => {
    const text = `Intro.

See ${ORIGIN}/changesets/${CHANGESET_ID}?ref=n/123
This skipped body must not become intro.

See ${ORIGIN}/changesets/${CHANGESET_ID}?ref=way/1
Kept.`
    expect(parse(text)).toEqual({
      intro: 'Intro.',
      notes: [{ ref: { type: 'way', id: 1 }, body: 'Kept.' }],
    })
  })

  test('returns notes: [] and never throws for garbage, empty input, and text with no URLs', () => {
    expect(parse('')).toEqual({ intro: '', notes: [] })
    expect(parse('   \n\t')).toEqual({ intro: '', notes: [] })
    expect(parse('plain prose, no links at all')).toEqual({
      intro: 'plain prose, no links at all',
      notes: [],
    })
    expect(parse('%%% not a url :::')).toEqual({ intro: '%%% not a url :::', notes: [] })
    expect(() => parse('')).not.toThrow()
    expect(() => parse('See not-a-url\nSee http://\nSee https://[')).not.toThrow()
  })

  test('accepts a matching hostname even when the URL includes a port', () => {
    expect(
      parse(`See https://osmcha.org:443/changesets/${CHANGESET_ID}?ref=way/1\nPort ok.`),
    ).toEqual({
      intro: '',
      notes: [{ ref: { type: 'way', id: 1 }, body: 'Port ok.' }],
    })
    expect(
      parse(`See http://127.0.0.1:3000/changesets/${CHANGESET_ID}?ref=way/2\nLocal.`, [
        '127.0.0.1',
      ]),
    ).toEqual({
      intro: '',
      notes: [{ ref: { type: 'way', id: 2 }, body: 'Local.' }],
    })
  })

  test('drops the header line, trims the intro and trailing body whitespace, and keeps internal blanks', () => {
    const text = `  Intro line.  

See ${ORIGIN}/changesets/${CHANGESET_ID}?ref=way/1
First.

Still first.

`
    expect(parse(text)).toEqual({
      intro: 'Intro line.',
      notes: [{ ref: { type: 'way', id: 1 }, body: 'First.\n\nStill first.' }],
    })
  })

  test('treats a trailing-slash changeset path as this changeset', () => {
    expect(parse(`See ${ORIGIN}/changesets/${CHANGESET_ID}/?ref=node/4\nSlash.`)).toEqual({
      intro: '',
      notes: [{ ref: { type: 'node', id: 4 }, body: 'Slash.' }],
    })
  })

  test('parses GitHub Pages /osmcha2/changesets/{id} on tordans.github.io', () => {
    const pages = `https://tordans.github.io/osmcha2/changesets/${CHANGESET_ID}?ref=way/123`
    expect(parse(`See \`way/123\` ${pages}\nFrom Pages.`)).toEqual({
      intro: '',
      notes: [{ ref: { type: 'way', id: 123 }, body: 'From Pages.' }],
    })
  })

  test('ignores another repo on the same GitHub Pages host', () => {
    const text = `See https://tordans.github.io/other-app/changesets/${CHANGESET_ID}?ref=way/1\nNot us.`
    expect(parse(text)).toEqual({ intro: text, notes: [] })
  })
})

describe('group notes', () => {
  const groupUrl = `${ORIGIN}/changesets/${CHANGESET_ID}?ref=node/14331471295/man_made&group=2`

  test('compose writes the first member, the key, the group size and a readable label', () => {
    const posted = compose({
      notes: [
        { ref: { type: 'node', id: 14331471295, key: 'man_made' }, group: 2, body: 'Wrong.' },
      ],
    })
    expect(posted).toBe(`See \`node/14331471295\` > \`man_made\` + 1 more ${groupUrl}\nWrong.`)
  })

  test('compose puts group before pin, and never lists members', () => {
    const posted = compose({
      notes: [
        { ref: { type: 'node', id: 1, key: 'man_made' }, group: 873, pin, body: 'Everywhere.' },
      ],
    })
    expect(posted).toBe(
      `See 📍 \`node/1\` > \`man_made\` + 872 more ${ORIGIN}/changesets/${CHANGESET_ID}?ref=node/1/man_made&group=873&pin=52.52014,13.40521\nEverywhere.`,
    )
    expect(posted.length).toBeLessThan(200)
  })

  test('parse reads the group size and round-trips with compose', () => {
    const notes: ComposeNote[] = [
      { ref: { type: 'node', id: 14331471295, key: 'man_made' }, group: 2, body: 'Group.' },
      { ref: { type: 'node', id: 7, key: 'man_made' }, body: 'Just this one.' },
      { ref: { type: 'way', id: 9, key: 'highway' }, group: 40, pin, body: 'Group with pin.' },
    ]
    const parsed = parse(compose({ notes }))
    expect(parsed.notes).toEqual(notes)
  })

  test('parse does not rely on the label', () => {
    expect(parse(`See ${groupUrl}\nNo label.`).notes).toEqual([
      { ref: { type: 'node', id: 14331471295, key: 'man_made' }, group: 2, body: 'No label.' },
    ])
    expect(parse(`See something else entirely ${groupUrl}\nOdd label.`).notes[0]?.group).toBe(2)
  })

  test('an invalid group is ignored and the note stays a normal tag note', () => {
    for (const bad of ['', '0', '1', '-3', 'abc', '2.5', '1e3', '99999999999999999999', '2%20']) {
      const parsed = parse(
        `See ${ORIGIN}/changesets/${CHANGESET_ID}?ref=node/1/man_made&group=${bad}\nBody.`,
      )
      expect(parsed.notes).toEqual([
        { ref: { type: 'node', id: 1, key: 'man_made' }, body: 'Body.' },
      ])
    }
  })

  test('a group without a tag key is ignored: only tag rows form groups', () => {
    expect(
      parse(`See ${ORIGIN}/changesets/${CHANGESET_ID}?ref=node/1&group=3\nBody.`).notes,
    ).toEqual([{ ref: { type: 'node', id: 1 }, body: 'Body.' }])
  })

  test('a post from before groups still parses as before', () => {
    expect(
      parse(
        `See \`node/1\` > \`man_made\` ${ORIGIN}/changesets/${CHANGESET_ID}?ref=node/1/man_made\nOld.`,
      ).notes,
    ).toEqual([{ ref: { type: 'node', id: 1, key: 'man_made' }, body: 'Old.' }])
  })
})

describe('composeDiscussionPost', () => {
  test('round-trips N notes: same targets and bodies; intro-only gets a footer, grouped posts do not', () => {
    const notes: ComposeNote[] = [
      { ref: { type: 'way', id: 123 }, body: 'Object note.' },
      { ref: { type: 'way', id: 123, key: 'highway' }, body: 'Tag note.' },
      { pin, body: 'Pin only.' },
      {
        ref: { type: 'way', id: 123, key: 'addr:street' },
        pin,
        body: 'Tag with pin.',
      },
    ]
    const grouped = compose({ intro: 'Thanks.', notes })
    expect(grouped).toBe(
      [
        'Thanks.',
        '',
        `See \`way/123\` ${ORIGIN}/changesets/${CHANGESET_ID}?ref=way/123`,
        'Object note.',
        '',
        `See \`way/123\` > \`highway\` ${ORIGIN}/changesets/${CHANGESET_ID}?ref=way/123/highway`,
        'Tag note.',
        '',
        `See 📍 ${ORIGIN}/changesets/${CHANGESET_ID}?pin=52.52014,13.40521`,
        'Pin only.',
        '',
        `See 📍 \`way/123\` > \`addr:street\` ${ORIGIN}/changesets/${CHANGESET_ID}?ref=way/123/addr:street&pin=52.52014,13.40521`,
        'Tag with pin.',
      ].join('\n'),
    )
    expect(grouped).not.toContain(`See ${ORIGIN}/changesets/${CHANGESET_ID}\n`)
    expect(grouped.endsWith(`See ${ORIGIN}/changesets/${CHANGESET_ID}`)).toBe(false)

    const parsed = parse(grouped)
    expect(parsed.intro).toBe('Thanks.')
    expect(parsed.notes.map((note) => ({ ...omitBody(note), body: note.body }))).toEqual(notes)

    const introOnly = compose({ intro: 'Just prose.' })
    expect(introOnly).toBe(`Just prose.\n\nSee ${ORIGIN}/changesets/${CHANGESET_ID}`)
    expect(parse(introOnly)).toEqual({ intro: 'Just prose.', notes: [] })
  })

  test('returns an empty string when intro and notes are empty', () => {
    expect(compose({})).toBe('')
    expect(compose({ intro: '  ', notes: [] })).toBe('')
  })

  test('default origin is the GitHub Pages site including /osmcha2', () => {
    const posted = composeDiscussionPost({
      changesetId: CHANGESET_ID,
      notes: [{ ref: { type: 'way', id: 1 }, body: 'Hi.' }],
    })
    expect(posted).toContain(
      `See \`way/1\` https://tordans.github.io/osmcha2/changesets/${CHANGESET_ID}?ref=way/1`,
    )
    expect(posted).not.toContain('https://osmcha.org/changesets/')
    expect(posted).not.toContain('localhost')
  })
})

function omitBody(target: NoteTarget & { body: string }): NoteTarget {
  const next: NoteTarget = {}
  if (target.ref) next.ref = target.ref
  if (target.group) next.group = target.group
  if (target.pin) next.pin = target.pin
  return next
}
