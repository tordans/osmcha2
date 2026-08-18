import { AccountPage } from '../components/secondary_pages_header.tsx'
import { Heading, Subheading } from '../components/ui/heading.tsx'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table.tsx'
import { Code, Text, TextLink } from '../components/ui/text.tsx'

const ABOUT_MD_URL = 'https://github.com/OSMCha/osmcha-frontend/blob/main/ABOUT.md'

const SHORTCUTS: Array<{ group: string; action: string; keys: string }> = [
  { group: 'Changeset list', action: 'Previous changeset', keys: '↑' },
  { group: 'Changeset list', action: 'Next changeset', keys: '↓ or →' },
  { group: 'Changeset list', action: 'Refresh changeset list', keys: 'R' },
  { group: 'Changeset detail', action: 'Open in JOSM', keys: 'J' },
  { group: 'Changeset detail', action: 'Open in iD', keys: 'I' },
  { group: 'Changeset detail', action: 'Open in OSM', keys: 'O' },
  { group: 'Changeset detail', action: 'Open in Achavi', keys: 'V' },
  { group: 'Changeset detail', action: 'Open user profile in HDYC', keys: 'H' },
  { group: 'Changeset detail', action: 'Open in Level0', keys: 'L' },
  { group: 'Changeset detail', action: 'Review as Good', keys: 'G' },
  { group: 'Changeset detail', action: 'Review as Bad', keys: 'B' },
  { group: 'Changeset detail', action: 'Undo or clear review', keys: 'U or C' },
  { group: 'Changeset detail', action: 'Filter edits of the current changeset’s user', keys: 'A' },
  { group: 'Panels', action: 'Toggle Changes tab', keys: '1' },
  { group: 'Panels', action: 'Toggle Discussion tab', keys: '2' },
  { group: 'Panels', action: 'Toggle User details', keys: '3' },
  { group: 'Panels', action: 'Toggle Map controls', keys: '8' },
  { group: 'Other', action: 'Toggle Filters page', keys: '\\' },
  { group: 'Other', action: 'Show this Guide page', keys: '? or /' },
]

export function About() {
  return (
    <AccountPage>
      <Heading>Guide</Heading>
      <Text>
        Keyboard shortcuts help you move through a list of changesets quickly. For the full OSMCha
        guide, see{' '}
        <TextLink href={ABOUT_MD_URL} target="_blank" rel="noreferrer">
          ABOUT.md on GitHub
        </TextLink>
        .
      </Text>

      <section className="flex flex-col gap-3">
        <Subheading>Keyboard shortcuts</Subheading>
        <Table striped>
          <TableHead>
            <TableRow>
              <TableHeader>Group</TableHeader>
              <TableHeader>Action</TableHeader>
              <TableHeader>Shortcut</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {SHORTCUTS.map((shortcut) => (
              <TableRow key={`${shortcut.group}-${shortcut.action}`}>
                <TableCell>{shortcut.group}</TableCell>
                <TableCell>{shortcut.action}</TableCell>
                <TableCell>
                  <Code>{shortcut.keys}</Code>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </AccountPage>
  )
}
