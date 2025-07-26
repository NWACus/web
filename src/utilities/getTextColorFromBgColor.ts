export default function getTextColorFromBgColor(colorClassName: string): string {
  const lastDash = colorClassName.lastIndexOf('-')
  if (lastDash === -1) return colorClassName

  const color = colorClassName.slice(0, lastDash)
  const shade = colorClassName.slice(lastDash + 1)
  return `text-${color}-foreground-${shade}`
}
