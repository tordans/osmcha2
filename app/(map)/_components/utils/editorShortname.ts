export const editorShortname = (longname: string | null | undefined) => {
  if (!longname) return 'UNKOWN' // Not given

  if (longname.toLowerCase().includes('streetcomplete')) return 'StreetComplete'
  if (longname.toLowerCase().includes('josm')) return 'JSOM'
  if (longname.toLowerCase().includes('every door')) return 'Every Door'
  if (longname.toLowerCase().includes('id')) return 'iD'
  if (longname.toLowerCase().includes('rapid')) return 'Rapid'
  if (longname.toLowerCase().includes('go map')) return 'GoMap'
  return longname.split(' ').at(0)
}

export const longerEditorShortname = (longname: string | null | undefined, host?: string) => {
  if (!longname) return 'UNKOWN (Not provided)' // Not given

  const shortName = editorShortname(longname)
  if (!host) return shortName

  let addition = ''

  if (host.includes('ideditor') && host.includes('netlify')) {
    addition = '(test version)'
  }

  if (host.includes('www.openstreetmap.org/edit')) {
    addition = '(official)'
  }

  return [shortName, addition].filter(Boolean).join(' ')
}
