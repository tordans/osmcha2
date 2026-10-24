import { describe, expect, test } from 'vitest'
import { buildElementChanges, type AdiffAction } from './changesetElements.ts'
import {
  hausdorffMeters,
  MINOR_NODE_MOVE_METERS,
  MINOR_WAY_MOVE_METERS,
  minorMoveObjectKeys,
} from './minorMoves.ts'

const LAT = 48
/** Degrees of latitude and of longitude (at LAT) that make one meter. */
const METER_LAT = 1 / 111_195
const METER_LON = METER_LAT / Math.cos((LAT * Math.PI) / 180)

type Node = { ref: number; lon: number; lat: number }

function line(shift: { lon?: number; lat?: number } = {}): Node[] {
  return [
    { ref: 1, lon: 10, lat: LAT },
    { ref: 2, lon: 10 + 100 * METER_LON, lat: LAT },
    { ref: 3, lon: 10 + 200 * METER_LON, lat: LAT },
  ].map((node) => ({
    ...node,
    lon: node.lon + (shift.lon ?? 0),
    lat: node.lat + (shift.lat ?? 0),
  }))
}

function square(shift: { lon?: number; lat?: number } = {}): Node[] {
  const corners = [
    { ref: 1, lon: 10, lat: LAT },
    { ref: 2, lon: 10 + 50 * METER_LON, lat: LAT },
    { ref: 3, lon: 10 + 50 * METER_LON, lat: LAT + 50 * METER_LAT },
    { ref: 4, lon: 10, lat: LAT + 50 * METER_LAT },
  ].map((node) => ({
    ...node,
    lon: node.lon + (shift.lon ?? 0),
    lat: node.lat + (shift.lat ?? 0),
  }))
  return [...corners, { ...corners[0]!, ref: 1 }]
}

function wayAction(
  oldNodes: Node[],
  newNodes: Node[],
  tags: { old?: Record<string, string>; new?: Record<string, string> } = {},
): AdiffAction {
  return {
    type: 'modify',
    old: {
      type: 'way',
      id: 10,
      version: 1,
      nodes: oldNodes,
      tags: tags.old ?? { highway: 'path' },
    },
    new: {
      type: 'way',
      id: 10,
      version: 2,
      nodes: newNodes,
      tags: tags.new ?? { highway: 'path' },
    },
  }
}

function nodeAction(
  shift: { lon?: number; lat?: number },
  tags: { old?: Record<string, string>; new?: Record<string, string> } = {},
): AdiffAction {
  return {
    type: 'modify',
    old: {
      type: 'node',
      id: 5,
      version: 1,
      lon: 10,
      lat: LAT,
      tags: tags.old ?? { amenity: 'bench' },
    },
    new: {
      type: 'node',
      id: 5,
      version: 2,
      lon: 10 + (shift.lon ?? 0),
      lat: LAT + (shift.lat ?? 0),
      tags: tags.new ?? { amenity: 'bench' },
    },
  }
}

function only(actions: AdiffAction[]) {
  const [change] = buildElementChanges(actions)
  if (!change) throw new Error('expected a listed change')
  return change
}

describe('limits', () => {
  test('are 2 m', () => {
    expect(MINOR_NODE_MOVE_METERS).toBe(2)
    expect(MINOR_WAY_MOVE_METERS).toBe(2)
  })
})

describe('minor node moves', () => {
  test('a node moved 1 m is minor and reports the distance', () => {
    const change = only([nodeAction({ lat: METER_LAT })])
    expect(change.geometry).toBe('moved')
    expect(change.minorMove?.meters).toBeCloseTo(1, 1)
  })

  test('a node moved 5 m is not minor', () => {
    const change = only([nodeAction({ lon: 5 * METER_LON })])
    expect(change.geometry).toBe('moved')
    expect(change.minorMove).toBeUndefined()
  })

  test('longitude counts as meters at this latitude', () => {
    expect(only([nodeAction({ lon: 1.5 * METER_LON })]).minorMove?.meters).toBeCloseTo(1.5, 1)
    expect(only([nodeAction({ lon: 2.5 * METER_LON })]).minorMove).toBeUndefined()
  })

  test('a node moved 1 m and retagged is not minor', () => {
    const change = only([
      nodeAction({ lat: METER_LAT }, { new: { amenity: 'bench', backrest: 'yes' } }),
    ])
    expect(change.minorMove).toBeUndefined()
  })

  test('a node that did not move has no minor move', () => {
    expect(only([nodeAction({})]).minorMove).toBeUndefined()
  })

  test('a node without coordinates is not minor', () => {
    const action = nodeAction({ lat: METER_LAT })
    delete action.old?.lat
    expect(only([action]).minorMove).toBeUndefined()
  })

  test('created and deleted nodes are not minor', () => {
    const created: AdiffAction = {
      type: 'create',
      new: { type: 'node', id: 5, version: 1, lon: 10, lat: LAT, tags: { amenity: 'bench' } },
    }
    expect(only([created]).minorMove).toBeUndefined()
  })
})

describe('minor way moves', () => {
  test('a way shifted 1 m is minor', () => {
    const change = only([wayAction(line(), line({ lat: METER_LAT }))])
    expect(change.geometry).toBe('moved')
    expect(change.minorMove?.meters).toBeCloseTo(1, 1)
  })

  test('a way with one vertex moved 10 m is not minor, however little the others moved', () => {
    const after = line({ lat: 0.5 * METER_LAT })
    after[2] = { ...after[2]!, lat: LAT + 10 * METER_LAT }
    const change = only([wayAction(line(), after)])
    expect(change.geometry).toBe('moved')
    expect(change.minorMove).toBeUndefined()
  })

  test('a way with rewritten nodes is neither moved nor minor', () => {
    const after = [...line({ lat: METER_LAT }), { ref: 4, lon: 10, lat: LAT + METER_LAT }]
    const change = only([wayAction(line(), after)])
    expect(change.geometry).toBe('rewritten')
    expect(change.minorMove).toBeUndefined()
  })

  test('an area shifted 1 m is minor', () => {
    const change = only([
      wayAction(square(), square({ lon: METER_LON }), {
        old: { building: 'yes' },
        new: { building: 'yes' },
      }),
    ])
    expect(change.geometry).toBe('moved')
    expect(change.minorMove?.meters).toBeCloseTo(1, 1)
  })

  test('a way shifted 1 m and retagged is not minor', () => {
    const change = only([
      wayAction(line(), line({ lat: METER_LAT }), { new: { highway: 'footway' } }),
    ])
    expect(change.minorMove).toBeUndefined()
  })

  test('a way with a missing coordinate is not minor', () => {
    const after: AdiffAction = wayAction(line(), line({ lat: METER_LAT }))
    after.new = {
      ...after.new,
      nodes: [{ ref: 1 }, { ref: 2, lon: 10, lat: LAT }, { ref: 3, lon: 10, lat: LAT }],
    }
    const change = only([after])
    expect(change.minorMove).toBeUndefined()
  })

  test('minorMoveObjectKeys lists only the minor moves', () => {
    const farNode = nodeAction({ lat: 20 * METER_LAT })
    if (farNode.old) farNode.old.id = 6
    if (farNode.new) farNode.new.id = 6
    const changes = buildElementChanges([nodeAction({ lat: METER_LAT }), farNode])
    expect(minorMoveObjectKeys(changes)).toEqual(['node/5'])
  })
})

describe('hausdorffMeters', () => {
  const at = (x: number, y: number) => ({ lon: 10 + x * METER_LON, lat: LAT + y * METER_LAT })

  test('is 0 for the same shape', () => {
    expect(hausdorffMeters([at(0, 0), at(10, 0)], [at(0, 0), at(10, 0)])).toBeCloseTo(0, 6)
  })

  test('measures to the nearest segment, not the nearest vertex', () => {
    // The vertex (5, 3) is 3 m from the segment (0,0)-(10,0), but 5.8 m from its nearest vertex.
    const meters = hausdorffMeters([at(0, 0), at(10, 0)], [at(0, 0), at(5, 3), at(10, 0)])
    expect(meters).toBeCloseTo(3, 1)
  })

  test('takes the larger direction', () => {
    // A is a short stub of B: every vertex of A lies on B, but B reaches 90 m further.
    const meters = hausdorffMeters([at(0, 0), at(10, 0)], [at(0, 0), at(100, 0)])
    expect(meters).toBeCloseTo(90, 0)
  })

  test('is undefined without a line to measure against', () => {
    expect(hausdorffMeters([at(0, 0)], [at(0, 0), at(10, 0)])).toBeUndefined()
    expect(hausdorffMeters([], [])).toBeUndefined()
  })
})
