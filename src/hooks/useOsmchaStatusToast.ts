import { useEffect } from 'react'
import { toast } from 'sonner'
import { useStatus } from '../query/hooks/useStatus.ts'

/** Mount once (root layout): warns when osmcha.org reports it is not fully operational. */
export function useOsmchaStatusToast() {
  const { data: status } = useStatus()

  useEffect(
    function toastOsmchaOperationalStatus() {
      if (status && status.status !== 'success') {
        // A fixed id keeps it to one toast, also when Strict Mode runs the effect twice.
        toast.warning('OSMCha Status', {
          id: 'osmcha-status',
          description: status.message,
          duration: 20000,
        })
      }
    },
    [status],
  )
}
