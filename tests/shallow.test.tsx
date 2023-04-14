import { describe, expect, it } from 'vitest'
import { create } from 'zustand'
import { shallow } from 'zustand/shallow'

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

  it('compares Maps', () => {
    function createMap<T extends object>(obj: T) {
      return new Map(Object.entries(obj))
    }

    expect(
      shallow(
        createMap({ foo: 'bar', asd: 123 }),
        createMap({ foo: 'bar', asd: 123 })
      )
    ).toBe(true)

    expect(
      shallow(
        createMap({ foo: 'bar', asd: 123 }),
        createMap({ foo: 'bar', foobar: true })
      )
    ).toBe(false)

    expect(
      shallow(
        createMap({ foo: 'bar', asd: 123 }),
        createMap({ foo: 'bar', asd: 123, foobar: true })
      )
    ).toBe(false)
  })

  it('compares Sets', () => {
    expect(shallow(new Set(['bar', 123]), new Set(['bar', 123]))).toBe(true)

    expect(shallow(new Set(['bar', 123]), new Set(['bar', 2]))).toBe(false)

    expect(shallow(new Set(['bar', 123]), new Set(['bar', 123, true]))).toBe(
      false
    )
  })

  it('compares functions', () => {
    function firstFnCompare() {
      return { foo: 'bar' }
    }

    function secondFnCompare() {
      return { foo: 'bar' }
    }

    expect(shallow(firstFnCompare, firstFnCompare)).toBe(true)

    expect(shallow(secondFnCompare, secondFnCompare)).toBe(true)

    expect(shallow(firstFnCompare, secondFnCompare)).toBe(false)
  })
})

describe('types', () => {
  it('works with useBoundStore and array selector (#1107)', () => {
    const useBoundStore = create(() => ({
      villages: [] as { name: string }[],
    }))
    const Component = () => {
      const villages = useBoundStore((state) => state.villages, shallow)
      return <>{villages.length}</>
    }
    expect(Component).toBeDefined()
  })

  it('works with useBoundStore and string selector (#1107)', () => {
    const useBoundStore = create(() => ({
      refetchTimestamp: '',
    }))
    const Component = () => {
      const refetchTimestamp = useBoundStore(
        (state) => state.refetchTimestamp,
        shallow
      )
      return <>{refetchTimestamp.toUpperCase()}</>
    }
    expect(Component).toBeDefined()
  })
})

describe('unsupported cases', () => {
  it('date', () => {
    expect(
      shallow(
        new Date('2022-07-19T00:00:00.000Z'),
        new Date('2022-07-20T00:00:00.000Z')
      )
    ).not.toBe(false)
  })
})
