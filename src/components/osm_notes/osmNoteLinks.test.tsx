import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'
import { getOsmNoteActions, useOsmNoteId, useOsmNoteOpen } from '../../stores/osm-note-store.ts'
import { LinkifyText } from '../text/LinkifyText.tsx'
import { isPlainClick } from './isPlainClick.ts'
import { OsmNoteChips } from './OsmNoteChips.tsx'

function Probe() {
  const open = useOsmNoteOpen()
  const noteId = useOsmNoteId()
  return <output data-testid="probe">{open ? `open ${noteId}` : 'closed'}</output>
}

afterEach(() => {
  getOsmNoteActions().close()
})

const click = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false }

describe('isPlainClick', () => {
  test('accepts a plain left click only', () => {
    expect(isPlainClick(click)).toBe(true)
    expect(isPlainClick({ ...click, metaKey: true })).toBe(false)
    expect(isPlainClick({ ...click, ctrlKey: true })).toBe(false)
    expect(isPlainClick({ ...click, shiftKey: true })).toBe(false)
    expect(isPlainClick({ ...click, altKey: true })).toBe(false)
    expect(isPlainClick({ ...click, button: 1 })).toBe(false)
    expect(isPlainClick({ ...click, defaultPrevented: true })).toBe(false)
  })
})

describe('LinkifyText with osmNotes', () => {
  test('a plain click on a note URL opens the quick view instead of navigating', () => {
    render(
      <>
        <LinkifyText text="see https://www.openstreetmap.org/note/5296798 done" osmNotes />
        <Probe />
      </>,
    )
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('https://www.openstreetmap.org/note/5296798')
    expect(link.getAttribute('target')).toBe('_blank')
    const notPrevented = fireEvent.click(link)
    expect(notPrevented).toBe(false)
    expect(screen.getByTestId('probe').textContent).toBe('open 5296798')
  })

  test('a cmd or ctrl click keeps the link behaviour', () => {
    render(
      <>
        <LinkifyText text="https://www.openstreetmap.org/note/12" osmNotes />
        <Probe />
      </>,
    )
    const link = screen.getByRole('link')
    expect(fireEvent.click(link, { metaKey: true })).toBe(true)
    expect(fireEvent.click(link, { ctrlKey: true })).toBe(true)
    expect(screen.getByTestId('probe').textContent).toBe('closed')
  })

  test('plain references become links too, other text stays linkified', () => {
    render(
      <>
        <LinkifyText text="note #7 and https://example.com/x" osmNotes />
        <Probe />
      </>,
    )
    fireEvent.click(screen.getByRole('link', { name: 'note #7' }))
    expect(screen.getByTestId('probe').textContent).toBe('open 7')
    expect(screen.getByRole('link', { name: 'https://example.com/x' }).getAttribute('href')).toBe(
      'https://example.com/x',
    )
  })

  test('keeps the text around the references', () => {
    const { container } = render(<LinkifyText text="a note/5 b" osmNotes />)
    expect(container.textContent).toBe('a note/5 b')
  })

  test('leaves note URLs as plain external links without osmNotes', () => {
    render(
      <>
        <LinkifyText text="https://www.openstreetmap.org/note/12" />
        <Probe />
      </>,
    )
    fireEvent.click(screen.getByRole('link'))
    expect(screen.getByTestId('probe').textContent).toBe('closed')
  })
})

describe('OsmNoteChips', () => {
  test('renders one chip per unique note and opens the quick view', () => {
    render(
      <>
        <OsmNoteChips text="note 3, https://osm.org/note/4 and note/3" />
        <Probe />
      </>,
    )
    expect(screen.getAllByRole('button')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Show OSM note 4' }))
    expect(screen.getByTestId('probe').textContent).toBe('open 4')
  })

  test('renders nothing without a note', () => {
    const { container } = render(<OsmNoteChips text="just a comment" />)
    expect(container.firstChild).toBeNull()
  })
})
