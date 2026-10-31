/** `SurroundingsIcon` (Phosphor's BoundingBox), for a label on the map, where no React icon can go. */
const SURROUNDINGS_ICON_PATH =
  'M208,96a16,16,0,0,0,16-16V48a16,16,0,0,0-16-16H176a16,16,0,0,0-16,16v8H96V48A16,16,0,0,0,80,32H48A16,16,0,0,0,32,48V80A16,16,0,0,0,48,96h8v64H48a16,16,0,0,0-16,16v32a16,16,0,0,0,16,16H80a16,16,0,0,0,16-16v-8h64v8a16,16,0,0,0,16,16h32a16,16,0,0,0,16-16V176a16,16,0,0,0-16-16h-8V96ZM176,48h32V80H176ZM48,48H80V63.9a.51.51,0,0,0,0,.2V80H48ZM80,208H48V176H80v15.9a.51.51,0,0,0,0,.2V208Zm128,0H176V176h32Zm-24-48h-8a16,16,0,0,0-16,16v8H96v-8a16,16,0,0,0-16-16H72V96h8A16,16,0,0,0,96,80V72h64v8a16,16,0,0,0,16,16h8Z'
const ICON_VIEW_BOX = 256
const ICON_PX = 14
const HEIGHT_PX = 18
const PADDING_PX = 4
const GAP_PX = 3
const FONT = '12px "Open Sans", sans-serif'

/** A small white tag with the surroundings icon and `text`, sharp on this screen. */
export function surroundingsLabelImage(text: string) {
  const pixelRatio = window.devicePixelRatio || 1
  const context = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!
  context.font = FONT
  const widthPx = Math.ceil(PADDING_PX * 2 + ICON_PX + GAP_PX + context.measureText(text).width)
  const canvas = context.canvas
  canvas.width = widthPx * pixelRatio
  canvas.height = HEIGHT_PX * pixelRatio
  // A new size resets the context.
  context.scale(pixelRatio, pixelRatio)
  context.fillStyle = 'rgba(255, 255, 255, 0.9)'
  context.beginPath()
  context.roundRect(0, 0, widthPx, HEIGHT_PX, [3, 3, 0, 0])
  context.fill()

  context.fillStyle = '#52525b'
  context.save()
  context.translate(PADDING_PX, (HEIGHT_PX - ICON_PX) / 2)
  context.scale(ICON_PX / ICON_VIEW_BOX, ICON_PX / ICON_VIEW_BOX)
  context.fill(new Path2D(SURROUNDINGS_ICON_PATH))
  context.restore()

  context.font = FONT
  context.textBaseline = 'middle'
  context.fillText(text, PADDING_PX + ICON_PX + GAP_PX, HEIGHT_PX / 2 + 0.5)

  return {
    image: context.getImageData(0, 0, canvas.width, canvas.height),
    pixelRatio,
  }
}
