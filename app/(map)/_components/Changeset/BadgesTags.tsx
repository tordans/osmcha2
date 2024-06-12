import { TOsmChaChangesets } from '@app/(map)/_data/OsmChaChangesets.zod'
import { Badge } from '@app/_components/core/badge'

type Props = {
  tags: TOsmChaChangesets['features'][number]['properties']['tags']
}

export const BadgesTags = ({ tags }: Props) => {
  return (
    <div className="space-x-1">
      {tags?.map((tag: { id: number; name: string }) => {
        return (
          <Badge key={tag.id} color={tag.id === 9 ? 'green' : undefined}>
            {tag.name}
          </Badge>
        )
      })}
    </div>
  )
}
