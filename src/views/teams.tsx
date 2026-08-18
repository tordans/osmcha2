import { FunnelIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/16/solid'
import { AccountPage, SecondaryPagesHeader } from '../components/secondary_pages_header.tsx'
import NewTeam from '../components/teams/new_team.tsx'
import { Button } from '../components/ui/button.tsx'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table.tsx'
import { Text } from '../components/ui/text.tsx'
import { useAuth } from '../hooks/useAuth.ts'
import {
  useCreateMappingTeam,
  useDeleteMappingTeam,
  useMappingTeams,
} from '../query/hooks/useMappingTeams.ts'
import { getObjAsQueryParam } from '../utils/query_params.ts'

type MappingTeam = {
  id: number
  name: string
}

type UserData = {
  username?: string
  avatar?: string
}

export function MappingTeams() {
  const { token, user } = useAuth()
  const currentUser = user as UserData | undefined
  const teamsQuery = useMappingTeams(currentUser?.username)
  const createMutation = useCreateMappingTeam()
  const deleteMutation = useDeleteMappingTeam()

  const createTeam = (name: string, users: object) => {
    if (!name || !users || !token) return
    createMutation.mutate({ name, users })
  }

  const removeTeam = (teamId: number) => {
    if (!teamId || !token) return
    deleteMutation.mutate(teamId)
  }

  const teams = (teamsQuery.data || []) as MappingTeam[]

  return (
    <AccountPage>
      <SecondaryPagesHeader title="Teams" avatar={currentUser?.avatar} />
      {token ? (
        <div className="flex flex-col gap-6">
          {teams.length === 0 ? (
            <Text>No teams yet.</Text>
          ) : (
            <Table striped>
              <TableHead>
                <TableRow>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>
                    <span className="sr-only">Actions</span>
                  </TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          plain
                          href={`/filters?${getObjAsQueryParam('filters', {
                            mapping_teams: [{ label: team.name, value: team.name }],
                          })}`}
                          className="min-h-11"
                        >
                          <FunnelIcon data-slot="icon" />
                          Changesets
                        </Button>
                        <Button outline href={`/teams/${team.id}`} className="min-h-11">
                          <PencilSquareIcon data-slot="icon" />
                          Edit
                        </Button>
                        <Button
                          plain
                          type="button"
                          className="min-h-11"
                          onClick={() => removeTeam(team.id)}
                        >
                          <TrashIcon data-slot="icon" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <NewTeam onCreate={createTeam} userIsOwner />
        </div>
      ) : null}
    </AccountPage>
  )
}
