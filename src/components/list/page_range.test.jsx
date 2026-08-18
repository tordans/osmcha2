import renderer from 'react-test-renderer'
import { PageRange } from './page_range.tsx'

it('renders a previous-page control', () => {
  const tree = renderer
    .create(
      <PageRange
        page="arrow-left"
        pageIndex={0}
        disabled={false}
        active={false}
        getChangesetsPage={() => {}}
      />,
    )
    .toJSON()

  expect(tree.props['aria-label']).toBe('Previous page')
})

it('renders the 1-based page number when active', () => {
  const tree = renderer
    .create(<PageRange page={4} pageIndex={4} active getChangesetsPage={() => {}} />)
    .toJSON()

  expect(tree.props['aria-current']).toBe('page')
  expect(tree.props['aria-label']).toBe('Page 5')
  expect(tree.children).toContain('5')
})
