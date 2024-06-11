import fs from 'fs'
import path from 'path'

export const writeDebugFile = ({
  parser,
  data,
  filename,
}: {
  parser: any
  data: any
  filename: string
}) => {
  try {
    parser.parse(data)
  } catch (error) {
    const file = path.join(__dirname, '../../../../../../tmp', 'filename.json')
    console.info(
      'ERROR with strict Zod parse. The file that created the error can be inspected at ',
      file,
    )
    fs.writeFileSync(file, JSON.stringify(data, undefined, 2))
  }
}
