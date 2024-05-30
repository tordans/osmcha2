export const editorShortname = (longname: string) => {
  if (longname.toLowerCase().includes('streetcomplete')) return 'StreetComplete'
  if (longname.toLowerCase().includes('josm')) return 'JSOM'
  if (longname.toLowerCase().includes('every door')) return 'Every Door'
  if (longname.toLowerCase().includes('id')) return 'iD'
  if (longname.toLowerCase().includes('rapid')) return 'Rapid'
  return longname.split(' ').at(0)
}
