import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createMappingTeam,
  deleteMappingTeam,
  updateMappingTeam,
} from '../../network/mapping_team.ts'
import { useAuthToken } from '../../stores/auth-store.ts'
import { mappingTeamQueryOptions, mappingTeamsQueryOptions } from '../options/account.ts'

export function useMappingTeams(username: string | undefined) {
  const token = useAuthToken()

  return useQuery({
    ...mappingTeamsQueryOptions(username!),
    enabled: !!token && !!username,
  })
}

export function useMappingTeam(teamId: number | null) {
  const token = useAuthToken()

  return useQuery({
    ...mappingTeamQueryOptions(teamId!),
    enabled: !!token && !!teamId,
  })
}

export function useCreateMappingTeam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, users }: { name: string; users: object }) =>
      createMappingTeam(name, users),
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['mappingTeams'] })
      toast.success('Team created', {
        description: variables.name,
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to create team', {
        description: error.message,
      })
    },
  })
}

export function useUpdateMappingTeam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ teamId, name, users }: { teamId: number; name: string; users: object }) =>
      updateMappingTeam(teamId, name, users),
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['mappingTeam', variables.teamId],
      })
      void queryClient.invalidateQueries({ queryKey: ['mappingTeams'] })
      toast.success('Team updated', {
        description: variables.name,
      })
    },
    onError: (error: Error) => {
      toast.error('Update failed', {
        description: error.message,
      })
    },
  })
}

export function useDeleteMappingTeam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (teamId: number) => deleteMappingTeam(teamId),
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['mappingTeams'] })
      toast.success('Team deleted', {
        description: String(variables),
      })
    },
    onError: (error: Error) => {
      void queryClient.invalidateQueries({ queryKey: ['mappingTeams'] })
      toast.error('Deletion failed', {
        description: error.message,
      })
    },
  })
}
