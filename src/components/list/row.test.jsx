import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { render, screen, waitFor } from '@testing-library/react'
import MockDate from 'mockdate'
import { routerSearch } from '../../routing/routerSearch.ts'
import { osmchaSearchSchema } from '../../routing/searchSchemas.ts'
import { PrimaryLine } from './primary_line.tsx'
import { Row } from './row.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

const rootRoute = createRootRoute({
  validateSearch: osmchaSearchSchema,
  component: () => <Outlet />,
})

function TestRowPage({ active }) {
  return (
    <Row
      properties={changeset.properties}
      active={active}
      changesetId={changeset.id}
      inputRef={() => {}}
    />
  )
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <TestRowPage active={false} />,
})

const activeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/active',
  component: () => <TestRowPage active={true} />,
})

const routeTree = rootRoute.addChildren([indexRoute, activeRoute])

function createTestRouter(initialEntry = '/') {
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
    parseSearch: routerSearch.parse,
    stringifySearch: routerSearch.stringify,
    trailingSlash: 'never',
    context: { queryClient },
  })
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

async function renderRow(active) {
  const router = createTestRouter(active ? '/active' : '/')
  await router.load()
  const view = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  await waitFor(() => {
    expect(screen.getByRole('link')).toBeTruthy()
  })
  return view
}

it('renders username, comment, editor, and review status', async () => {
  MockDate.set(1497172627326)
  const { container } = await renderRow(false)
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

it('marks the active row with a blue background and a visible chevron', async () => {
  MockDate.set(1497172627326)
  await renderRow(true)
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
