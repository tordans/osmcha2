import { TOsmChaChangesets } from '@app/(map)/_data/OsmChaChangesets.zod'
import { Badge } from '@app/_components/core/badge'

type Props = {
  tags: TOsmChaChangesets['features'][number]['properties']['tags']
}

const isResolvedTag = (tag: { id: number }) => tag.id === 9

export const hasResolvedTags = (tags: Props['tags']) => {
  return tags.some((tag) => tag.id === 9)
}

export const BadgesCheckTags = ({ tags }: Props) => {
  if (!tags.length) return null

  return (
    <div className="flex items-center gap-2">
      {tags.map((tag: { id: number; name: string }) => {
        return (
          <Badge key={tag.id} color={isResolvedTag(tag) ? 'green' : undefined}>
            {tag.name}
          </Badge>
        )
      })}
    </div>
  )
}
