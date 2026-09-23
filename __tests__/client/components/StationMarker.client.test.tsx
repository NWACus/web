import { StationMarker, WebcamMarker } from '@/components/stationMap/StationMarker'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

describe('StationMarker', () => {
  it('is a coloured dot with no label', () => {
    render(
      <StationMarker
        name="Paradise"
        color="#d35400"
        label={null}
        isWindDirection={false}
        highlighted={false}
        onClick={() => {}}
      />,
    )
    const marker = screen.getByTestId('station-marker')
    expect(marker).toHaveAttribute('title', 'Paradise')
    expect(marker).toHaveStyle({ backgroundColor: '#d35400' })
    expect(marker).toHaveTextContent('')
    expect(marker.className).toContain('rounded-full')
  })

  it('carries the reading when a label is chosen', () => {
    render(
      <StationMarker
        name="Paradise"
        color="#d35400"
        label={32}
        isWindDirection={false}
        highlighted={false}
        onClick={() => {}}
      />,
    )
    const marker = screen.getByTestId('station-marker')
    expect(marker).toHaveTextContent('32')
    expect(marker.className).not.toContain('rounded-full')
  })

  it('draws a wind direction as an arrow pointing downwind', () => {
    const { container } = render(
      <StationMarker
        name="Paradise"
        color="#d35400"
        label={90}
        isWindDirection
        highlighted={false}
        onClick={() => {}}
      />,
    )
    const arrow = container.querySelector('svg')
    expect(arrow).toHaveStyle({ transform: 'rotate(270deg)' })
    expect(screen.getByTestId('station-marker')).not.toHaveTextContent('90')
  })

  it('reports clicks', () => {
    const onClick = jest.fn()
    render(
      <StationMarker
        name="Paradise"
        color="#d35400"
        label={null}
        isWindDirection={false}
        highlighted={false}
        onClick={onClick}
      />,
    )
    fireEvent.click(screen.getByTestId('station-marker'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

describe('WebcamMarker', () => {
  it('is titled and clickable', () => {
    const onClick = jest.fn()
    render(<WebcamMarker title="Dirtyface" highlighted={false} onClick={onClick} />)
    const marker = screen.getByTestId('webcam-marker')
    expect(marker).toHaveAttribute('title', 'Dirtyface')
    fireEvent.click(marker)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
