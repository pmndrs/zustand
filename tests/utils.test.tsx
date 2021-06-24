import { deepMerge, isObject } from '../src/utils'

describe('deepMerge function', () => {
  it('merges nested objects', () => {
    const o1 = {
      a: 'a',
      b: {
        c: 'c',
      },
    }
    const o2 = {
      b: {
        d: 'd',
      },
      e: 'e',
    }

    const result = deepMerge(o1, o2)

    expect(result).toEqual({
      a: 'a',
      b: {
        c: 'c',
        d: 'd',
      },
      e: 'e',
    })
  })

  it('prioritize the source over the target', () => {
    const o1 = {
      a: 'a',
      b: {
        c: 'c',
      },
    }
    const o2 = {
      b: 'b',
    }

    const result = deepMerge(o1, o2)

    expect(result).toEqual({
      a: 'a',
      b: 'b',
    })
  })
})

describe('isObject function', () => {
  it('matches an object', () => {
    const result = isObject({})

    expect(result).toBe(true)
  })

  it('does not match inherited instances of Object', () => {
    expect(isObject([])).toBe(false)
    expect(isObject(() => {})).toBe(false)
  })
})
