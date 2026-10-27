export default function getTextColorFromBgColor(colorClassName: string): string {
  if (colorClassName === 'white') return 'text-foreground'
  const lastDash = colorClassName.lastIndexOf('-')
  if (lastDash === -1) return ''

  const color = colorClassName.slice(0, lastDash)
  const shade = colorClassName.slice(lastDash + 1)
  return `text-${color}-foreground-${shade}`
}
