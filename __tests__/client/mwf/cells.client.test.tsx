// Keyboard-first entry behaviors for the MWF grid cells: commit on
// Enter/blur, 500 ft arrow stepping with snapping and clamping, and
// non-compass wind entries clearing rather than persisting.
import { LevelCell, NumberCell, WindDirCell, parseNumber, snapLevel } from '@/views/MwfEditor/cells'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

describe('snapLevel', () => {
  it('snaps to the nearest 500 between 0 and 16,000', () => {
    expect(snapLevel(4321)).toBe(4500)
    expect(snapLevel(4249)).toBe(4000)
    expect(snapLevel(-200)).toBe(0)
    expect(snapLevel(99999)).toBe(16000)
    expect(snapLevel(null)).toBeNull()
  })
})

describe('parseNumber', () => {
  it('empty and non-numeric input clear the value', () => {
    expect(parseNumber('')).toBeNull()
    expect(parseNumber('  ')).toBeNull()
    expect(parseNumber('abc')).toBeNull()
    expect(parseNumber('0.25')).toBe(0.25)
  })
})

describe('NumberCell', () => {
  it('commits on blur, not per keystroke', () => {
    const onChange = jest.fn()
    render(<NumberCell ariaLabel="qpf" value={null} onChange={onChange} />)
    const input = screen.getByLabelText('qpf')
    fireEvent.change(input, { target: { value: '0.25' } })
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.blur(input)
    expect(onChange).toHaveBeenCalledWith(0.25)
  })

  it('commits on Enter', () => {
    const onChange = jest.fn()
    render(<NumberCell ariaLabel="qpf" value={null} onChange={onChange} />)
    const input = screen.getByLabelText('qpf')
    fireEvent.change(input, { target: { value: '1.5' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.blur(input)
    expect(onChange).toHaveBeenCalledWith(1.5)
  })
})

describe('LevelCell', () => {
  it('arrow keys step by 500 and commit immediately', () => {
    const onChange = jest.fn()
    render(<LevelCell ariaLabel="level" value={4500} onChange={onChange} />)
    const input = screen.getByLabelText('level')
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(onChange).toHaveBeenCalledWith(5000)
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(onChange).toHaveBeenCalledWith(4500)
  })

  it('snaps a typed value on commit', () => {
    const onChange = jest.fn()
    render(<LevelCell ariaLabel="level" value={null} onChange={onChange} />)
    const input = screen.getByLabelText('level')
    fireEvent.change(input, { target: { value: '4321' } })
    fireEvent.blur(input)
    expect(onChange).toHaveBeenCalledWith(4500)
  })

  it('clamps stepping at the 0 and 16,000 bounds', () => {
    const onChange = jest.fn()
    render(<LevelCell ariaLabel="level" value={16000} onChange={onChange} />)
    fireEvent.keyDown(screen.getByLabelText('level'), { key: 'ArrowUp' })
    expect(onChange).toHaveBeenCalledWith(16000)
  })
})

describe('WindDirCell', () => {
  it('uppercases and keeps valid compass points (incl. VAR)', () => {
    const onChange = jest.fn()
    render(<WindDirCell ariaLabel="dir" value="" onChange={onChange} />)
    const input = screen.getByLabelText('dir')
    fireEvent.change(input, { target: { value: 'sw' } })
    fireEvent.blur(input)
    expect(onChange).toHaveBeenCalledWith('SW')

    fireEvent.change(input, { target: { value: 'var' } })
    fireEvent.blur(input)
    expect(onChange).toHaveBeenCalledWith('VAR')
  })

  it('clears a non-compass typo instead of keeping it', () => {
    const onChange = jest.fn()
    render(<WindDirCell ariaLabel="dir" value="SW" onChange={onChange} />)
    const input = screen.getByLabelText('dir')
    fireEvent.change(input, { target: { value: 'XQ' } })
    fireEvent.blur(input)
    expect(onChange).toHaveBeenCalledWith('')
  })
})
