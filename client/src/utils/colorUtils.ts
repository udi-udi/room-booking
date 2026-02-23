/**
 * Returns true if the given hex color is perceptually bright (ITU-R BT.709 luminance).
 * Use to decide whether to render text as black or white on top of the color.
 */
export function isColorBright(hex: string): boolean {
  const color = hex.replace('#', '')
  const r = parseInt(color.slice(0, 2), 16)
  const g = parseInt(color.slice(2, 4), 16)
  const b = parseInt(color.slice(4, 6), 16)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 128
}

/** Returns '#000000' or '#ffffff' depending on the perceived brightness of hex. */
export function textColorForBg(hex: string): '#000000' | '#ffffff' {
  return isColorBright(hex) ? '#000000' : '#ffffff'
}
