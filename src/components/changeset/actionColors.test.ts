import { describe, expect, test } from 'vitest'
import { ACTION, remapAdiffActionLayers, remapAdiffActionPaint } from './actionColors.ts'

describe('remapAdiffActionPaint', () => {
  test('rewrites adiff-viewer hex to registry colors', () => {
    expect(remapAdiffActionPaint('#4ECDC4')).toBe(ACTION.create.hex)
    expect(remapAdiffActionPaint('#FFE66D')).toBe(ACTION.modify.hex)
    expect(remapAdiffActionPaint('#FF6B6B')).toBe(ACTION.delete.hex)
    expect(remapAdiffActionPaint('#8B79C4')).toBe(ACTION.noop.hex)
  })

  test('walks nested maplibre expressions', () => {
    const expression = [
      'match',
      ['get', 'action'],
      'create',
      '#4ECDC4',
      'modify',
      '#FFE66D',
      'delete',
      '#FF6B6B',
      '#8B79C4',
    ]
    expect(remapAdiffActionPaint(expression)).toEqual([
      'match',
      ['get', 'action'],
      'create',
      ACTION.create.hex,
      'modify',
      ACTION.modify.hex,
      'delete',
      ACTION.delete.hex,
      ACTION.noop.hex,
    ])
  })

  test('leaves unrelated paint values alone', () => {
    expect(remapAdiffActionPaint('#888888')).toBe('#888888')
    expect(remapAdiffActionPaint(1)).toBe(1)
  })
})

describe('remapAdiffActionLayers', () => {
  test('rewrites line and circle paint on a copy', () => {
    const layers = [
      { id: 'changeset-way-new', paint: { 'line-color': '#4ECDC4', 'line-width': 2 } },
      { id: 'changeset-node-unchanged', paint: { 'circle-color': '#8B79C4' } },
      { id: 'changeset-overlay-bg' },
    ]
    const remapped = remapAdiffActionLayers(layers)
    expect(remapped[0]?.paint?.['line-color']).toBe(ACTION.create.hex)
    expect(remapped[0]?.paint?.['line-width']).toBe(2)
    expect(remapped[1]?.paint?.['circle-color']).toBe(ACTION.noop.hex)
    expect(layers[0]?.paint?.['line-color']).toBe('#4ECDC4')
  })
})
