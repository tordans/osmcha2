import { createFileRoute } from '@tanstack/react-router'
import { MappingTeams } from '../views/teams.tsx'

export const Route = createFileRoute('/teams')({
  component: MappingTeams,
})
