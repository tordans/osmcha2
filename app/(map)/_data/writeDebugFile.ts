import fs from 'fs'
import os from 'os'
import path from 'path'

const tmpDir = path.join(os.tmpdir(), 'osmcha2')

export const writeDebugFile = ({
  parser,
  data,
  filename,
}: {
  parser: any
  data: any
  filename: string
}) => {
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true })
  }

  try {
    parser.parse(data)
  } catch (error) {
    const file = path.resolve(tmpDir, `${filename}.json`)
    console.info(
      'ERROR with strict Zod parse. The file that created the error can be inspected at ',
      file,
    )
    fs.writeFileSync(file, JSON.stringify(data, undefined, 2))
  }
}

export const writeStringInTmpFolder = (filename: string, content: string) => {
  const file = path.resolve(__dirname, '../../../../../../tmp', `${filename}.json`)
  console.info('INFO debug file written at', file)
  fs.writeFileSync(file, content)
  return
}
