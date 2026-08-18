import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import MockDate from 'mockdate'
import { StaticRouter } from 'react-router'
import { PrimaryLine } from './primary_line.tsx'
import { Row } from './row.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

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
  return render(
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
  const { container } = renderRow(false)
  const text = container.textContent ?? ''

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
  renderRow(true)
  const link = screen.getByRole('link')

  expect(link.className).toContain('bg-blue-50')
  expect(link.textContent).toContain('DaryR')
  MockDate.reset()
})

it('renders PrimaryLine as username: comment', () => {
  const { container } = render(
    <QueryClientProvider client={queryClient}>
      <PrimaryLine
        user={changeset.properties.user}
        uid={Number(changeset.properties.uid)}
        comment={changeset.properties.comment}
      />
    </QueryClientProvider>,
  )

  expect(container.textContent).toContain('DaryR')
  expect(container.textContent).toContain('#hotosm-project-2999')
})
