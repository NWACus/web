import Color from 'color'

import tailwindConfig from 'tailwind.config.mjs'
import resolveConfig from 'tailwindcss/resolveConfig'
import { DefaultColors } from 'tailwindcss/types/generated/colors'

type ColorKey = keyof DefaultColors
type ShadeKey = keyof DefaultColors[ColorKey]

export default function getTextColorFromBgColor(className: string) {
  const fullConfig = resolveConfig(tailwindConfig)

  const match = className.split('-')
  const color = match[0] as ColorKey
  const shade = (match[1] as ShadeKey) || null

  const colorAsHex = shade ? fullConfig.theme.colors[color][shade] : fullConfig.theme.colors[color]

  console.log(colorAsHex)

  const bgColor = Color(colorAsHex)
  return bgColor.isLight() ? 'text-black' : 'text-white'
}
