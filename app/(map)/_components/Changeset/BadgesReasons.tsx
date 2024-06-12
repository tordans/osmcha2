import { TOsmChaChangesets } from '@app/(map)/_zod/OsmChaChangesets.zod'
import { Badge } from '@components/core/badge'

type Props = {
  reasons: TOsmChaChangesets['features'][number]['properties']['reasons']
}

export const BadgesReasons = ({ reasons }: Props) => {
  return (
    <div className="space-x-1">
      {reasons.map((reason: { id: number; name: string }) => {
        return <Badge key={reason.id}>{reason.name}</Badge>
      })}
    </div>
  )
}
