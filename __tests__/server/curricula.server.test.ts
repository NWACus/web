import { curriculaData } from '@/constants/curricula'

describe('curriculaData', () => {
  it('has unique values', () => {
    const values = curriculaData.map((c) => c.value)
    expect(new Set(values).size).toBe(values.length)
  })

  it('has unique labels', () => {
    const labels = curriculaData.map((c) => c.label)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('contains the expected curriculum options', () => {
    const values = curriculaData.map((c) => c.value)
    expect(values).toContain('aiare')
    expect(values).toContain('aai')
    expect(values).toContain('sas')
    expect(values).toContain('mtc')
    expect(values).toContain('provider-developed')
  })

  it('has 5 options', () => {
    expect(curriculaData).toHaveLength(5)
  })
})
