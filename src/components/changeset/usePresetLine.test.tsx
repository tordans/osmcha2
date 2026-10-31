import { render, screen, waitFor } from '@testing-library/react'
import { memo, useEffect } from 'react'
import { describe, expect, test } from 'vitest'
import { getPresetState } from '../../presets/presetStore.ts'
import { buildElementChanges, type AdiffAction, type ElementChange } from './changesetElements.ts'
import { presetContextOf } from './elementPresets.ts'
import { PresetContextValue, usePresetLine, useSharedPresetLine } from './usePresetLine.ts'

const actions: AdiffAction[] = Array.from({ length: 40 }, (_, index) => ({
  type: 'create',
  new: {
    type: 'node',
    id: index + 1,
    lon: 13.4,
    lat: 52.5,
    tags: { amenity: 'cafe' },
  },
}))
const changes = buildElementChanges(actions)
const context = presetContextOf(actions)

const renders = { rows: 0 }
const Row = memo(function Row({ change, enabled }: { change: ElementChange; enabled: boolean }) {
  const line = usePresetLine(change, enabled)
  useEffect(() => {
    renders.rows += 1
  })
  return <li data-testid={`row-${change.id}`}>{line ?? '-'}</li>
})

function List({ selected, enabled }: { selected: number | null; enabled: boolean }) {
  return (
    <PresetContextValue value={context}>
      <p data-selected={selected} />
      <ul>
        {changes.map((change) => (
          <Row key={change.id} change={change} enabled={enabled} />
        ))}
      </ul>
    </PresetContextValue>
  )
}

function Group() {
  const line = useSharedPresetLine(changes)
  return <p data-testid="group">{line ?? '-'}</p>
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 50))

// These run in order: the preset store is a module, so it loads once for the whole file.
describe('usePresetLine', () => {
  test('loads nothing while no row asks for a line (compact rows, minor moves)', async () => {
    render(<List selected={null} enabled={false} />)
    await tick()
    expect(getPresetState().matcher).toBeUndefined()
    expect(screen.getByTestId('row-1').textContent).toBe('-')
  })

  test('shows no line first, then the preset name once the data has loaded', async () => {
    render(<List selected={null} enabled />)
    expect(screen.getByTestId('row-1').textContent).toBe('-')
    await waitFor(() => expect(screen.getByTestId('row-1').textContent).toBe('Cafe'))
    expect(screen.getByTestId('row-40').textContent).toBe('Cafe')
  })

  test('a selection that changes only the parent does not render the memoized rows again', async () => {
    const { rerender } = render(<List selected={null} enabled />)
    await waitFor(() => expect(screen.getByTestId('row-1').textContent).toBe('Cafe'))
    const before = renders.rows
    rerender(<List selected={3} enabled />)
    rerender(<List selected={4} enabled />)
    expect(renders.rows).toBe(before)
  })

  test('a group shows the line that all its members share', async () => {
    render(<Group />)
    await waitFor(() => expect(screen.getByTestId('group').textContent).toBe('Cafe'))
  })
})
