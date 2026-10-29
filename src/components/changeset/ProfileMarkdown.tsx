import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { prepareProfileMarkdown } from '../../utils/profileMarkdown.ts'

/** The mapper's profile text. Loads on its own: the Markdown parser is about 40 KB gzip. */
export default function ProfileMarkdown({ description }: { description: string }) {
  return <Markdown remarkPlugins={[remarkGfm]}>{prepareProfileMarkdown(description)}</Markdown>
}
