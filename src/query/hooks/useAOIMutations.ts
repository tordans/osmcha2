import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { toast } from 'sonner'
import { createAOI, deleteAOI, updateAOI } from '../../network/aoi.ts'
import { stripFilterSearch } from '../../routing/filterSearch.ts'

const rootRouteApi = getRouteApi('__root__')

export function useCreateAOI() {
  const queryClient = useQueryClient()
  const navigate = rootRouteApi.useNavigate()

  return useMutation({
    mutationFn: ({ name, filters }: { name: string; filters: any }) => createAOI(name, filters),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['aois'] })
      toast.success('AOI created')
      void navigate({
        to: '/',
        search: (prev) => ({
          ...stripFilterSearch(prev),
          aoi: String(data.id),
          page: undefined,
        }),
        replace: true,
      })
    },
    onError: (error: Error) => {
      console.error('Failed to create AOI:', error)
      toast.error('Failed to create AOI', { description: error.message })
    },
  })
}

export function useUpdateAOI() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ aoiId, name, filters }: { aoiId: string; name: string; filters: any }) =>
      updateAOI(aoiId, name, filters),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['aoi', variables.aoiId] })
      void queryClient.invalidateQueries({ queryKey: ['aois'] })
      toast.success('AOI updated')
    },
    onError: (error: Error) => {
      console.error('Failed to update AOI:', error)
      toast.error('Failed to update AOI', { description: error.message })
    },
  })
}

export function useDeleteAOI() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (aoiId: string) => deleteAOI(aoiId),
    onSuccess: (_data, aoiId) => {
      void queryClient.invalidateQueries({ queryKey: ['aoi', aoiId] })
      void queryClient.invalidateQueries({ queryKey: ['aois'] })
      toast.success('AOI deleted')
    },
    onError: (error: Error) => {
      console.error('Failed to delete AOI:', error)
      toast.error('Failed to delete AOI', { description: error.message })
    },
  })
}
