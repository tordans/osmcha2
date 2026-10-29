import { fireEvent, render, screen } from '@testing-library/react'
import { act } from 'react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  getStreetImageryViewerActions,
  useStreetImageryViewerOpen,
  useStreetImageryViewerPhoto,
} from '../../stores/street-imagery-viewer-store.ts'
import { TagRows, type TagRowsItem } from '../tag_rows.tsx'

const OLD = '111111111111111'
const NEW = '444210030563481'
const UUID = '3f1c2d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f'

function Probe() {
  const photo = useStreetImageryViewerPhoto()
  const open = useStreetImageryViewerOpen()
  return <output data-testid="probe">{open && photo ? `${photo.provider}:${photo.id}` : ''}</output>
}

function renderRows(rows: TagRowsItem[], onKeyClick?: (key: string) => void) {
  return render(
    <>
      <TagRows rows={rows} onKeyClick={onKeyClick} />
      <Probe />
    </>,
  )
}

afterEach(() => {
  act(() => getStreetImageryViewerActions().close())
})

describe('photo buttons in tag rows', () => {
  test('a button per photo opens the viewer for that photo', () => {
    renderRows([
      { kind: 'added', key: 'mapillary', value: NEW },
      { kind: 'unchanged', key: 'panoramax:1', value: UUID },
    ])

    fireEvent.click(screen.getByRole('button', { name: `Open Mapillary photo ${NEW}` }))
    expect(screen.getByTestId('probe').textContent).toBe(`mapillary:${NEW}`)

    fireEvent.click(screen.getByRole('button', { name: `Open Panoramax photo ${UUID}` }))
    expect(screen.getByTestId('probe').textContent).toBe(`panoramax:${UUID}`)
  })

  test('one button per id of a value with several ids', () => {
    renderRows([{ kind: 'added', key: 'mapillary:2', value: `${NEW};${OLD}` }])
    expect(screen.getAllByRole('button', { name: /^Open Mapillary photo/ })).toHaveLength(2)
  })

  test('opening a photo does not select the tag row', () => {
    const onKeyClick = vi.fn()
    renderRows([{ kind: 'added', key: 'mapillary', value: NEW }], onKeyClick)

    fireEvent.click(screen.getByRole('button', { name: `Open Mapillary photo ${NEW}` }))
    expect(onKeyClick).not.toHaveBeenCalled()
  })

  test('a changed row shows the new photo and marks the dropped old one', () => {
    renderRows([{ kind: 'changed', key: 'mapillary', oldValue: OLD, newValue: NEW }])

    expect(screen.getByRole('button', { name: `Open Mapillary photo ${NEW}` })).toBeTruthy()
    expect(
      screen.getByRole('button', { name: `Open Mapillary photo ${OLD} (old value)` }),
    ).toBeTruthy()
  })

  test('a removed row keeps its old photo, dimmed', () => {
    renderRows([{ kind: 'removed', key: 'mapillary', value: OLD }])
    const button = screen.getByRole('button', { name: `Open Mapillary photo ${OLD} (old value)` })
    expect(button.className).toContain('opacity-60')
  })

  test('other rows have no photo button', () => {
    renderRows([
      { kind: 'added', key: 'name', value: NEW },
      { kind: 'added', key: 'mapillary', value: 'yes' },
    ])
    expect(screen.queryByRole('button', { name: /Open .* photo/ })).toBeNull()
  })
})
