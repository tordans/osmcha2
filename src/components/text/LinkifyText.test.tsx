import { QueryClient } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { routerSearch } from '../../routing/routerSearch.ts'
import { osmchaSearchSchema } from '../../routing/searchSchemas.ts'
import { LinkifyText } from './LinkifyText.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
})

const rootRoute = createRootRoute({
  validateSearch: osmchaSearchSchema,
  component: () => <Outlet />,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <LinkifyText text="used #hotosm-project-2999" />,
})

describe('LinkifyText', () => {
  test('turns newlines into br when nl2br is set', () => {
    const { container } = render(<LinkifyText text={'line one\nline two'} nl2br />)
    expect(container.querySelectorAll('br')).toHaveLength(1)
    expect(container.textContent).toContain('line one')
    expect(container.textContent).toContain('line two')
  })

  test('does not insert br by default', () => {
    const { container } = render(<LinkifyText text={'line one\nline two'} />)
    expect(container.querySelectorAll('br')).toHaveLength(0)
  })

  test('autolinks urls', () => {
    render(<LinkifyText text="see https://openstreetmap.org/way/1 please" />)
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('https://openstreetmap.org/way/1')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })

  test('autolinks @mentions to OSM user pages', () => {
    render(<LinkifyText text="cc @nammala" />)
    expect(screen.getByRole('link').getAttribute('href')).toBe(
      'https://www.openstreetmap.org/user/nammala',
    )
  })

  test('links hashtags to a comment filter on the changeset list', async () => {
    const router = createRouter({
      routeTree: rootRoute.addChildren([indexRoute]),
      history: createMemoryHistory({ initialEntries: ['/'] }),
      parseSearch: routerSearch.parse,
      stringifySearch: routerSearch.stringify,
      trailingSlash: 'never',
      context: { queryClient },
    })
    await router.load()
    render(<RouterProvider router={router} />)

    const link = screen.getByRole('link', { name: '#hotosm-project-2999' })
    const href = decodeURIComponent(link.getAttribute('href') ?? '')
    expect(href).toContain('filters')
    expect(href).toContain('#hotosm-project-2999')
  })
})
