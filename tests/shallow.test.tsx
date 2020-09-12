import shallow from '../src/shallow'

describe('shallow', () => {
  it('compares primitive values', () => {
    expect(shallow(true, true)).toBe(true)
    expect(shallow(true, false)).toBe(false)

    expect(shallow(1, 1)).toBe(true)
    expect(shallow(1, 2)).toBe(false)

    expect(shallow('zustand', 'zustand')).toBe(true)
    expect(shallow('zustand', 'redux')).toBe(false)
  })

  it('compares objects', () => {
    expect(shallow({ foo: 'bar', asd: 123 }, { foo: 'bar', asd: 123 })).toBe(
      true
    )

    expect(
      shallow({ foo: 'bar', asd: 123 }, { foo: 'bar', foobar: true })
    ).toBe(false)

    expect(
      shallow({ foo: 'bar', asd: 123 }, { foo: 'bar', asd: 123, foobar: true })
    ).toBe(false)
  })

  it('compares arrays', () => {
    expect(shallow([1, 2, 3], [1, 2, 3])).toBe(true)

    expect(shallow([1, 2, 3], [2, 3, 4])).toBe(false)

    expect(
      shallow([{ foo: 'bar' }, { asd: 123 }], [{ foo: 'bar' }, { asd: 123 }])
    ).toBe(false)

    expect(shallow([{ foo: 'bar' }], [{ foo: 'bar', asd: 123 }])).toBe(false)
  })
})
