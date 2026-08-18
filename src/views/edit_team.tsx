import { getRouteApi } from '@tanstack/react-router'
import { AccountPage, SecondaryPagesHeader } from '../components/secondary_pages_header.tsx'
import { SignIn } from '../components/sign_in.tsx'
import NewTeam from '../components/teams/new_team.tsx'
import { Heading } from '../components/ui/heading.tsx'
import { useAuth } from '../hooks/useAuth.ts'
import { useMappingTeam, useUpdateMappingTeam } from '../query/hooks/useMappingTeams.ts'

const teamRouteApi = getRouteApi('/teams/$id')

type TeamUser = {
  username?: string
  uid?: string
  joined?: string
  left?: string
}

type TeamData = {
  id: number
  name: string
  owner?: string
  users: TeamUser[]
}

type UserData = {
  username?: string
  avatar?: string
}

export function EditMappingTeam() {
  const { id: teamId } = teamRouteApi.useParams()
  const { token, user } = useAuth()
  const teamQuery = useMappingTeam(teamId)
  const updateMutation = useUpdateMappingTeam()
  const currentUser = user as UserData | undefined
  const team = teamQuery.data as TeamData | undefined

  const editTeam = (teamIdToEdit: number, name: string, users: object) => {
    if (!name || !users || !token) return
    updateMutation.mutate({
      teamId: teamIdToEdit,
      name,
      users,
    })
  }

  return (
    <AccountPage>
      <SecondaryPagesHeader title="Edit team" avatar={currentUser?.avatar} />
      {token ? (
        <div className="flex flex-col gap-6">
          <Heading level={2}>Editing mapping team: {team?.name}</Heading>
          <NewTeam
            key={team?.id ?? 'loading'}
            onChange={editTeam}
            editing
            activeTeam={team}
            userIsOwner={team?.owner === currentUser?.username}
          />
        </div>
      ) : (
        <SignIn />
      )}
    </AccountPage>
  )
}
