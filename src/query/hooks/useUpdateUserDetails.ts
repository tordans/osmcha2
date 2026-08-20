import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { updateUserDetails } from '../../network/auth.ts'

export function useUpdateUserDetails() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      messageGood,
      messageBad,
      commentFeature,
    }: {
      messageGood: string
      messageBad: string
      commentFeature: boolean
    }) => updateUserDetails(messageGood, messageBad, commentFeature),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user', 'details'] })
      toast.success('Preferences saved')
    },
    onError: (error: Error) => {
      toast.error('Failed to save preferences', {
        description: error.message,
      })
    },
  })
}
