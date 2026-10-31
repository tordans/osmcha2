// bun run generate-presets: writes src/presets/data/matching-presets.json from the installed
// @openstreetmap/id-tagging-schema (see src/presets/generate.ts).
import presets from '@openstreetmap/id-tagging-schema/dist/presets.min.json'
import translations from '@openstreetmap/id-tagging-schema/dist/translations/en.min.json'
import { buildMatchingData } from '../src/presets/generate.ts'

const records = buildMatchingData(presets, translations)
const target = new URL('../src/presets/data/matching-presets.json', import.meta.url)
await Bun.write(target, JSON.stringify(records))
console.log(`${records.length} presets written to ${target.pathname}`)
