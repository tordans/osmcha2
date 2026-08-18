import { render, screen } from '@testing-library/react'
import { PageRange } from './page_range.tsx'

it('renders a previous-page control', () => {
  render(
    <PageRange
      page="arrow-left"
      pageIndex={0}
      disabled={false}
      active={false}
      getChangesetsPage={() => {}}
    />,
  )

  expect(screen.getByRole('button', { name: 'Previous page' })).toBeTruthy()
})

it('renders the 1-based page number when active', () => {
  render(<PageRange page={4} pageIndex={4} active getChangesetsPage={() => {}} />)

  const button = screen.getByRole('button', { name: 'Page 5', current: 'page' })
  expect(button.textContent).toContain('5')
})
