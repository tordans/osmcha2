import { describe, expect, test } from 'vitest'
import {
  AREA_LINK_METERS,
  clusterChangesBySpace,
  LINE_LINK_METERS,
  POINT_LINK_METERS,
} from './changeGroupClusters.ts'
import {
  buildElementChanges,
  groupChangesByTagMutation,
  type AdiffAction,
  type ElementChange,
} from './changesetElements.ts'

const ORIGIN = { lon: 13.4, lat: 52.5 }
const METERS_PER_DEGREE = 111_195
const METERS_PER_LON_DEGREE = METERS_PER_DEGREE * Math.cos((ORIGIN.lat * Math.PI) / 180)

/** A place `east` and `north` meters from the test origin. */
function place(east: number, north = 0) {
  return {
    lon: ORIGIN.lon + east / METERS_PER_LON_DEGREE,
    lat: ORIGIN.lat + north / METERS_PER_DEGREE,
  }
}

type Corner = [ref: number, east: number, north?: number]

function wayNodes(corners: Corner[]) {
  return corners.map(([ref, east, north = 0]) => ({ ref, ...place(east, north) }))
}

/** `highway=path` → `highway=footway`, with untouched `name` / `ref` tags. */
function retaggedWay(
  id: number,
  corners: Corner[],
  keep: Record<string, string> = {},
): AdiffAction {
  const nodes = wayNodes(corners)
  return {
    type: 'modify',
    old: { type: 'way', id, version: 1, nodes, tags: { highway: 'path', ...keep } },
    new: { type: 'way', id, version: 2, nodes, tags: { highway: 'footway', ...keep } },
  }
}

function line(id: number, corners: Corner[], keep?: Record<string, string>): AdiffAction {
  return retaggedWay(id, corners, keep)
}

/** A square of `size` meters whose south-west corner is at `east`, `north`. */
function square(id: number, east: number, north: number, size: number, firstRef: number) {
  const ref = (offset: number) => firstRef + offset
  return retaggedWay(
    id,
    [
      [ref(0), east, north],
      [ref(1), east + size, north],
      [ref(2), east + size, north + size],
      [ref(3), east, north + size],
      [ref(0), east, north],
    ],
    { building: 'yes' },
  )
}

function tree(id: number, east: number, north = 0): AdiffAction {
  const { lon, lat } = place(east, north)
  return {
    type: 'modify',
    old: { type: 'node', id, version: 1, lon, lat, tags: { natural: 'tree' } },
    new: {
      type: 'node',
      id,
      version: 2,
      lon,
      lat,
      tags: { natural: 'tree', leaf_type: 'broadleaved' },
    },
  }
}

function groupIds(actions: AdiffAction[]): string[][] {
  return groupChangesByTagMutation(buildElementChanges(actions)).map((group) =>
    group.map((change) => `${change.type}/${change.id}`),
  )
}

describe('line clusters', () => {
  test('groups street segments that share a node', () => {
    expect(
      groupIds([
        line(1, [
          [1, 0],
          [2, 100],
        ]),
        line(2, [
          [2, 100],
          [3, 200],
        ]),
      ]),
    ).toEqual([['way/1', 'way/2']])
  })

  test('groups segments whose endpoints are 10 m apart', () => {
    expect(
      groupIds([
        line(1, [
          [1, 0],
          [2, 100],
        ]),
        line(2, [
          [3, 110],
          [4, 200],
        ]),
      ]),
    ).toEqual([['way/1', 'way/2']])
  })

  test('also measures from the first node of one to the last node of the other', () => {
    expect(
      groupIds([
        line(1, [
          [1, 0],
          [2, 100],
        ]),
        line(2, [
          [3, 200],
          [4, 90],
        ]),
      ]),
    ).toEqual([['way/1', 'way/2']])
  })

  test('keeps segments 200 m apart separate', () => {
    expect(
      groupIds([
        line(1, [
          [1, 0],
          [2, 100],
        ]),
        line(2, [
          [3, 300],
          [4, 400],
        ]),
      ]),
    ).toEqual([['way/1'], ['way/2']])
  })

  test('uses the threshold as the limit', () => {
    const near = LINE_LINK_METERS - 1
    const far = LINE_LINK_METERS + 1
    const pair = (gap: number) =>
      groupIds([
        line(1, [
          [1, 0],
          [2, 100],
        ]),
        line(2, [
          [3, 100 + gap],
          [4, 200],
        ]),
      ])
    expect(pair(near)).toEqual([['way/1', 'way/2']])
    expect(pair(far)).toEqual([['way/1'], ['way/2']])
  })

  test('does not link a way that only passes by the end of another', () => {
    expect(
      groupIds([
        line(1, [
          [1, 0],
          [2, 100],
        ]),
        line(2, [
          [3, 50, -100],
          [4, 50, 100],
        ]),
      ]),
    ).toEqual([['way/1'], ['way/2']])
  })

  test('keeps touching segments with different names apart', () => {
    expect(
      groupIds([
        line(
          1,
          [
            [1, 0],
            [2, 100],
          ],
          { name: 'Main Street' },
        ),
        line(
          2,
          [
            [2, 100],
            [3, 200],
          ],
          { name: 'Side Street' },
        ),
      ]),
    ).toEqual([['way/1'], ['way/2']])
  })

  test('keeps nearby segments with different names apart', () => {
    expect(
      groupIds([
        line(
          1,
          [
            [1, 0],
            [2, 100],
          ],
          { name: 'Main Street' },
        ),
        line(
          2,
          [
            [3, 105],
            [4, 200],
          ],
          { name: 'Side Street' },
        ),
      ]),
    ).toEqual([['way/1'], ['way/2']])
  })

  test('keeps touching segments with different refs apart', () => {
    expect(
      groupIds([
        line(
          1,
          [
            [1, 0],
            [2, 100],
          ],
          { ref: 'B 1' },
        ),
        line(
          2,
          [
            [2, 100],
            [3, 200],
          ],
          { ref: 'B 2' },
        ),
      ]),
    ).toEqual([['way/1'], ['way/2']])
  })

  test('groups touching segments with the same name and ref', () => {
    expect(
      groupIds([
        line(
          1,
          [
            [1, 0],
            [2, 100],
          ],
          { name: 'Main Street', ref: 'B 1' },
        ),
        line(
          2,
          [
            [2, 100],
            [3, 200],
          ],
          { name: 'Main Street', ref: 'B 1' },
        ),
      ]),
    ).toEqual([['way/1', 'way/2']])
  })

  test('a segment without a name is compatible with a named one', () => {
    expect(
      groupIds([
        line(
          1,
          [
            [1, 0],
            [2, 100],
          ],
          { name: 'Main Street' },
        ),
        line(2, [
          [2, 100],
          [3, 200],
        ]),
      ]),
    ).toEqual([['way/1', 'way/2']])
  })

  test('compares the name after the change and falls back to the old name when it was removed', () => {
    const changes = buildElementChanges([
      line(1, [
        [1, 0],
        [2, 100],
      ]),
      line(2, [
        [2, 100],
        [3, 200],
      ]),
    ])
    const [first, second] = changes
    if (!first || !second) throw new Error('expected two changes')
    // Renamed to the other segment's name: compatible.
    first.tags = [{ kind: 'changed', key: 'name', oldValue: 'Old Road', newValue: 'Main Street' }]
    second.tags = [{ kind: 'unchanged', key: 'name', value: 'Main Street' }]
    expect(clusterChangesBySpace(changes)).toEqual([0, 0])
    // The old name is not what counts when a new one exists.
    first.tags = [{ kind: 'changed', key: 'name', oldValue: 'Main Street', newValue: 'New Road' }]
    expect(clusterChangesBySpace(changes)).toEqual([0, 1])
    // A removed name still counts as the name.
    first.tags = [{ kind: 'removed', key: 'name', value: 'Side Street' }]
    expect(clusterChangesBySpace(changes)).toEqual([0, 1])
    first.tags = [{ kind: 'removed', key: 'name', value: 'Main Street' }]
    expect(clusterChangesBySpace(changes)).toEqual([0, 0])
  })

  test('chains segments transitively', () => {
    expect(
      groupIds([
        line(1, [
          [1, 0],
          [2, 100],
        ]),
        line(3, [
          [5, 300],
          [6, 400],
        ]),
        line(2, [
          [2, 100],
          [3, 200],
          [4, 295],
        ]),
      ]),
    ).toEqual([['way/1', 'way/3', 'way/2']])
  })

  test('a name conflict between the ends of a chain does not cut a compatible middle', () => {
    // 1 (Main) – 2 (no name) – 3 (Side): 2 links to both, so single linkage joins all three.
    expect(
      groupIds([
        line(
          1,
          [
            [1, 0],
            [2, 100],
          ],
          { name: 'Main Street' },
        ),
        line(2, [
          [2, 100],
          [3, 200],
        ]),
        line(
          3,
          [
            [3, 200],
            [4, 300],
          ],
          { name: 'Side Street' },
        ),
      ]),
    ).toEqual([['way/1', 'way/2', 'way/3']])
  })

  test('never mixes lines with other geometry kinds', () => {
    expect(
      groupIds([
        line(
          1,
          [
            [1, 0],
            [2, 100],
          ],
          { building: 'yes' },
        ),
        square(2, 0, 0, 100, 10),
      ]),
    ).toEqual([['way/1'], ['way/2']])
  })
})

describe('point clusters', () => {
  test('groups trees 30 m apart and keeps a tree 500 m away separate', () => {
    expect(groupIds([tree(1, 0), tree(2, 30), tree(3, 500)])).toEqual([
      ['node/1', 'node/2'],
      ['node/3'],
    ])
  })

  test('groups a chain of trees each 40 m from the next', () => {
    expect(groupIds([tree(1, 0), tree(3, 80), tree(2, 40), tree(4, 120)])).toEqual([
      ['node/1', 'node/3', 'node/2', 'node/4'],
    ])
  })

  test('uses the threshold as the limit', () => {
    expect(groupIds([tree(1, 0), tree(2, POINT_LINK_METERS - 1)])).toEqual([['node/1', 'node/2']])
    expect(groupIds([tree(1, 0), tree(2, POINT_LINK_METERS + 1)])).toEqual([['node/1'], ['node/2']])
  })

  test('measures diagonally and north-south', () => {
    expect(groupIds([tree(1, 0), tree(2, 0, 45)])).toEqual([['node/1', 'node/2']])
    expect(groupIds([tree(1, 0), tree(2, 40, 40)])).toEqual([['node/1'], ['node/2']])
  })

  test('keeps the same tag change in two neighbourhoods apart', () => {
    expect(groupIds([tree(1, 0), tree(2, 3000, 2000), tree(3, 10), tree(4, 3010, 2000)])).toEqual([
      ['node/1', 'node/3'],
      ['node/2', 'node/4'],
    ])
  })

  test('works at high latitudes and across the grid cells', () => {
    const north = (id: number, east: number): AdiffAction => {
      const lat = 68
      const lon = 20 + east / (METERS_PER_DEGREE * Math.cos((lat * Math.PI) / 180))
      return {
        type: 'modify',
        old: { type: 'node', id, version: 1, lon, lat, tags: { natural: 'tree' } },
        new: { type: 'node', id, version: 2, lon, lat, tags: { natural: 'tree', leaf_type: 'x' } },
      }
    }
    expect(groupIds([north(1, 0), north(2, 45), north(3, 90), north(4, 400)])).toEqual([
      ['node/1', 'node/2', 'node/3'],
      ['node/4'],
    ])
  })

  test('agrees with a brute-force comparison on scattered points', () => {
    let seed = 7
    const random = () => {
      seed = (seed * 1_664_525 + 1_013_904_223) % 4_294_967_296
      return seed / 4_294_967_296
    }
    const actions = Array.from({ length: 400 }, (_, index) =>
      tree(index + 1, random() * 1000 - 500, random() * 1000 - 500),
    )
    const changes = buildElementChanges(actions)
    const labels = clusterChangesBySpace(changes)

    // Brute force: flood fill over every pair within the threshold.
    const expected = changes.map((_, index) => index)
    const root = (index: number): number => {
      let node = index
      while (expected[node] !== node) node = expected[node] ?? node
      return node
    }
    const meters = (left: ElementChange, right: ElementChange) =>
      Math.hypot(
        ((left.lon ?? 0) - (right.lon ?? 0)) * METERS_PER_LON_DEGREE,
        ((left.lat ?? 0) - (right.lat ?? 0)) * METERS_PER_DEGREE,
      )
    for (let left = 0; left < changes.length; left++) {
      for (let right = left + 1; right < changes.length; right++) {
        const leftChange = changes[left]
        const rightChange = changes[right]
        if (leftChange && rightChange && meters(leftChange, rightChange) <= POINT_LINK_METERS) {
          expected[Math.max(root(left), root(right))] = Math.min(root(left), root(right))
        }
      }
    }

    const sameCluster = (a: number[], i: number, j: number) => a[i] === a[j]
    const brute = changes.map((_, index) => root(index))
    for (let i = 0; i < changes.length; i++) {
      for (let j = i + 1; j < changes.length; j++) {
        expect(sameCluster(labels, i, j)).toBe(sameCluster(brute, i, j))
      }
    }
    // More than one cluster and at least one merged cluster, so the comparison means something.
    expect(new Set(labels).size).toBeGreaterThan(1)
    expect(new Set(labels).size).toBeLessThan(changes.length)
  })

  test('handles thousands of points in one tag change', () => {
    const actions = Array.from({ length: 4000 }, (_, index) =>
      tree(index + 1, (index % 80) * 200, Math.floor(index / 80) * 200),
    )
    // 200 m grid spacing: nothing is within 50 m of anything else.
    expect(groupIds(actions)).toHaveLength(4000)
  })
})

describe('area clusters', () => {
  test('groups areas that share a node', () => {
    const second = retaggedWay(
      2,
      [
        [11, 100, 0],
        [20, 200, 0],
        [21, 200, 100],
        [22, 100, 100],
        [11, 100, 0],
      ],
      { building: 'yes' },
    )
    expect(groupIds([square(1, 0, 0, 100, 10), second])).toEqual([['way/1', 'way/2']])
  })

  test('groups areas whose bounding boxes are 20 m apart', () => {
    expect(groupIds([square(1, 0, 0, 100, 10), square(2, 120, 0, 100, 20)])).toEqual([
      ['way/1', 'way/2'],
    ])
    expect(groupIds([square(1, 0, 0, 100, 10), square(2, 0, 120, 100, 20)])).toEqual([
      ['way/1', 'way/2'],
    ])
  })

  test('groups areas with overlapping bounding boxes', () => {
    expect(groupIds([square(1, 0, 0, 100, 10), square(2, 50, 50, 100, 20)])).toEqual([
      ['way/1', 'way/2'],
    ])
  })

  test('keeps areas further apart than the threshold separate', () => {
    expect(
      groupIds([
        square(1, 0, 0, 100, 10),
        square(2, 100 + AREA_LINK_METERS + 5, 0, 100, 20),
        square(3, 0, 500, 100, 30),
      ]),
    ).toEqual([['way/1'], ['way/2'], ['way/3']])
  })

  test('chains areas transitively, including around a large area', () => {
    expect(
      groupIds([square(1, 0, 0, 100, 10), square(3, 0, 0, 1000, 30), square(2, 1010, 0, 100, 20)]),
    ).toEqual([['way/1', 'way/3', 'way/2']])
  })

  test('treats a closed way with fewer than 4 nodes as a line', () => {
    const sliver = line(2, [
      [1, 0],
      [2, 50],
      [1, 0],
    ])
    expect(
      groupIds([
        line(1, [
          [3, 0, 10],
          [4, 50, 10],
        ]),
        sliver,
      ]),
    ).toEqual([['way/1', 'way/2']])
  })
})

describe('mixed and special cases', () => {
  test('keeps a node and a way with the same tag change apart', () => {
    const node: AdiffAction = {
      type: 'modify',
      old: { type: 'node', id: 1, version: 1, ...place(5), tags: { highway: 'path' } },
      new: { type: 'node', id: 1, version: 2, ...place(5), tags: { highway: 'footway' } },
    }
    expect(
      groupIds([
        node,
        line(2, [
          [1, 0],
          [2, 100],
        ]),
      ]),
    ).toEqual([['node/1'], ['way/2']])
  })

  test('does not group relations by place, only by tag change', () => {
    const relation = (id: number, to: string): AdiffAction => ({
      type: 'modify',
      old: { type: 'relation', id, version: 1, tags: { type: 'route', route: 'bus' } },
      new: { type: 'relation', id, version: 2, tags: { type: 'route', route: to } },
    })
    expect(groupIds([relation(1, 'tram'), relation(2, 'train'), relation(3, 'tram')])).toEqual([
      ['relation/1', 'relation/3'],
      ['relation/2'],
    ])
  })

  test('keeps different tag changes apart even in the same place', () => {
    const other: AdiffAction = {
      type: 'modify',
      old: { type: 'node', id: 2, version: 1, ...place(5), tags: { natural: 'tree' } },
      new: { type: 'node', id: 2, version: 2, ...place(5), tags: { natural: 'tree', height: '9' } },
    }
    expect(groupIds([tree(1, 0), other])).toEqual([['node/1'], ['node/2']])
  })

  test('keeps an element without coordinates in its own group', () => {
    const lost = (id: number): AdiffAction => ({
      type: 'modify',
      old: { type: 'node', id, version: 1, tags: { natural: 'tree' } },
      new: { type: 'node', id, version: 2, tags: { natural: 'tree', leaf_type: 'broadleaved' } },
    })
    expect(groupIds([tree(1, 0), lost(2), lost(3), tree(4, 10)])).toEqual([
      ['node/1', 'node/4'],
      ['node/2'],
      ['node/3'],
    ])
  })

  test('keeps a way without node coordinates in its own group', () => {
    const bare = (id: number): AdiffAction => ({
      type: 'modify',
      old: { type: 'way', id, version: 1, nodes: [1, 2], tags: { highway: 'path' } },
      new: { type: 'way', id, version: 2, nodes: [1, 2], tags: { highway: 'footway' } },
    })
    expect(groupIds([bare(1), bare(2)])).toEqual([['way/1'], ['way/2']])
  })

  test('orders groups by their first member and keeps the input order inside them', () => {
    expect(
      groupIds([tree(5, 5000), tree(1, 0), tree(6, 5010), tree(3, 20), tree(7, 9000), tree(2, 10)]),
    ).toEqual([['node/5', 'node/6'], ['node/1', 'node/3', 'node/2'], ['node/7']])
  })

  test('labels equal changes with the index of their first member', () => {
    const changes = buildElementChanges([tree(1, 0), tree(2, 1000), tree(3, 10)])
    expect(clusterChangesBySpace(changes)).toEqual([0, 1, 0])
  })

  test('groups deleted ways by their old nodes', () => {
    const deleted = (id: number, corners: Corner[]): AdiffAction => ({
      type: 'delete',
      old: { type: 'way', id, version: 1, nodes: wayNodes(corners), tags: { highway: 'path' } },
    })
    expect(
      groupIds([
        deleted(1, [
          [1, 0],
          [2, 100],
        ]),
        deleted(2, [
          [2, 100],
          [3, 200],
        ]),
      ]),
    ).toEqual([['way/1', 'way/2']])
  })
})
