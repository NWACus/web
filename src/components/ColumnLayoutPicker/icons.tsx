import type { SVGProps } from 'react'

const GAP = 2
const RADIUS = 1.5
const TOP = 5
const HEIGHT = 14
const LEFT = 2
const WIDTH = 20

type ColumnsIconProps = {
  parts: number[]
} & SVGProps<SVGSVGElement>

export const ColumnsIcon = ({ parts, ...props }: ColumnsIconProps) => {
  const total = parts.reduce((sum, part) => sum + part, 0)
  const unit = (WIDTH - GAP * (parts.length - 1)) / total

  let x = LEFT
  const blocks = parts.map((part) => {
    const block = { x, width: unit * part }
    x += block.width + GAP
    return block
  })

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      {blocks.map((block, i) => (
        <rect key={i} x={block.x} y={TOP} width={block.width} height={HEIGHT} rx={RADIUS} />
      ))}
    </svg>
  )
}
