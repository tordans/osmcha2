import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import MockDate from 'mockdate'
import { StaticRouter } from 'react-router'
import renderer from 'react-test-renderer'
import { PrimaryLine } from './primary_line.tsx'
import { Row } from './row.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

function textOf(node) {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (typeof node === 'object' && 'children' in node) {
    return textOf(node.children)
  }
  return ''
}

function classOf(node) {
  if (!node || typeof node !== 'object' || !('props' in node)) return ''
  return node.props?.className ?? ''
}

const changeset = {
  id: 49328744,
  properties: {
    check_user: 'nammala',
    reasons: [
      { id: 4, name: 'mass deletion' },
      { id: 72, name: 'Randomized flag' },
    ],
    tags: [
      { id: 1, name: 'intentional' },
      { id: 2, name: 'unintentional' },
    ],
    user: 'DaryR',
    uid: '4569402',
    editor: 'JOSM/1.5 (10966 en)',
    comment: '#hotosm-project-2999 #MissingMaps #EndMalaria #Mali',
    date: '2017-06-07T08:25:38Z',
    create: 1624,
    modify: 26,
    delete: 2666,
    harmful: true,
    checked: true,
    comments_count: 2,
  },
}

function renderRow(active) {
  return renderer.create(
    <QueryClientProvider client={queryClient}>
      <StaticRouter location="/">
        <Row
          properties={changeset.properties}
          active={active}
          changesetId={changeset.id}
          inputRef={() => {}}
        />
      </StaticRouter>
    </QueryClientProvider>,
  )
}

it('renders username, comment, editor, and review status', () => {
  MockDate.set(1497172627326)
  const tree = renderRow(false).toJSON()
  const text = textOf(tree)

  expect(text).toContain('DaryR')
  expect(text).toContain('#hotosm-project-2999 #MissingMaps #EndMalaria #Mali')
  expect(text).toContain('JOSM')
  expect(text).toContain('by')
  expect(text).toContain('nammala')
  expect(text).toContain('intentional')
  expect(text).not.toContain('49328744')
  expect(text).not.toContain('1624')
  MockDate.reset()
})

it('marks the active row with a blue background and a visible chevron', () => {
  MockDate.set(1497172627326)
  const tree = renderRow(true).toJSON()
  const link = tree.children?.[0]

  expect(classOf(link)).toContain('bg-blue-50')
  expect(textOf(tree)).toContain('DaryR')
  MockDate.reset()
})

it('renders PrimaryLine as username: comment', () => {
  const tree = renderer
    .create(
      <QueryClientProvider client={queryClient}>
        <PrimaryLine
          user={changeset.properties.user}
          uid={Number(changeset.properties.uid)}
          comment={changeset.properties.comment}
        />
      </QueryClientProvider>,
    )
    .toJSON()

  expect(textOf(tree)).toContain('DaryR')
  expect(textOf(tree)).toContain('#hotosm-project-2999')
})
