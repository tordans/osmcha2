import { TOsmChaChangesets } from '@app/(map)/_zod/OsmChaChangesets.zod'
import { Badge } from '@components/core/badge'

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
