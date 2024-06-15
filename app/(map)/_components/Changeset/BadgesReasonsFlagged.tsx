import { TOsmChaChangesets } from '@app/(map)/_data/OsmChaChangesets.zod'
import { Badge } from '@app/_components/core/badge'

type Props = {
  reasons: TOsmChaChangesets['features'][number]['properties']['reasons']
}

export const BadgesReasonsFlagged = ({ reasons }: Props) => {
  return (
    <div className="space-x-1">
      {reasons.map((reason: { id: number; name: string }) => {
        return <Badge key={reason.id}>{reason.name}</Badge>
      })}
    </div>
  )
}
