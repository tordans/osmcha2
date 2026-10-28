import type { CountryPrefixType } from '@osm-traffic-signs/converter'
import { countryPrefixOfValue } from './trafficSignRows.ts'

export type ResolvedSign = {
  /** The sign id (`314`, `274-30`) or, for an unknown sign, the raw id from the value. */
  id: string
  /** The sign's name (`Parkplatz`); the raw id for an unknown sign. */
  name: string
  /** Longer explanation of the sign, when the catalogue has one. */
  description?: string
  recognized: boolean
  /** URL of the sign's SVG; missing when the catalogue has none for it. */
  svgUrl?: string
}

// The catalogue of all countries is a large chunk: import it on first use, once.
let converterPromise: Promise<typeof import('@osm-traffic-signs/converter')> | undefined
function loadConverter() {
  converterPromise ??= import('@osm-traffic-signs/converter')
  return converterPromise
}

/**
 * The signs of a `traffic_sign` value (`DE:314,1044-11`) with name and icon. Empty when the value has
 * no known country prefix. Every SVG is its own lazy chunk and loads here, so a missing one only costs
 * the icon.
 */
export async function resolveTrafficSigns(value: string): Promise<ResolvedSign[]> {
  if (countryPrefixOfValue(value) == null) return []
  const { countries, loadTrafficSignSvg, trafficSignTagToSigns } = await loadConverter()
  const country = countryPrefixOfValue(value, countries) as CountryPrefixType | undefined
  if (!country) return []

  return Promise.all(
    trafficSignTagToSigns(value, country).map(async (sign): Promise<ResolvedSign> => {
      if (!sign.recognized)
        return { id: sign.osmValuePart, name: sign.osmValuePart, recognized: false }
      const svgUrl = await loadTrafficSignSvg(country, sign).catch(() => undefined)
      return {
        id: sign.signId,
        name: sign.descriptiveName ?? sign.name,
        description: sign.description ?? undefined,
        recognized: true,
        svgUrl,
      }
    }),
  )
}
