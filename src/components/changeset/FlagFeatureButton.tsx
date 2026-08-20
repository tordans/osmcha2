import { FlagIcon } from '@heroicons/react/16/solid'
import { useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../../hooks/useAuth.ts'
import { flagFeature, unflagFeature } from '../../network/changeset.ts'
import { Button } from '../ui/button.tsx'

type FlagFeatureButtonProps = {
  changesetId: number
  featureId: string
  initiallyFlagged: boolean
}

export function FlagFeatureButton({
  changesetId,
  featureId,
  initiallyFlagged,
}: FlagFeatureButtonProps) {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [optimisticFlagged, setOptimisticFlagged] = useState<boolean | null>(null)
  const flagged = optimisticFlagged ?? initiallyFlagged

  async function handleClick() {
    if (!token) {
      toast.error('You must be logged in to flag features')
      return
    }
    const next = !flagged
    setOptimisticFlagged(next)
    try {
      if (flagged) {
        await unflagFeature(changesetId, featureId)
      } else {
        await flagFeature(changesetId, featureId)
      }
      void queryClient.invalidateQueries({ queryKey: ['changeset', changesetId] })
    } catch {
      setOptimisticFlagged(null)
      toast.error('Could not update flagged feature')
    }
  }

  return (
    <Button
      outline
      aria-label={flagged ? `Remove flag from ${featureId}` : `Add ${featureId} to flagged`}
      onClick={() => void handleClick()}
      className={clsx(
        'min-h-11 min-w-11 cursor-pointer touch-manipulation p-0 select-none',
        flagged && '[--btn-icon:var(--color-orange-600)]',
      )}
    >
      <FlagIcon data-slot="icon" />
    </Button>
  )
}
