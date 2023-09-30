import { useState } from 'react'
import { act, fireEvent, render, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { create } from 'zustand'
import { useStore } from 'zustand/react'
import { shallow, useShallow } from 'zustand/shallow'

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

describe('useShallow', () => {
  const useTestShallowSimple = <S, U>(props: {
    selector: (state: S) => U
    state: S
  }): { selectorOutput: U; useShallowOutput: U } => {
    const useShallowOutput = useShallow(props.selector)(props.state)
    return {
      selectorOutput: props.selector(props.state),
      useShallowOutput,
    }
  }

  it('input and output selectors always return shallow equal values', () => {
    const initialProps = {
      selector: (state: Record<string, number>) => Object.keys(state),
      state: { a: 1, b: 2 } as Record<string, number>,
    }

    const res = renderHook((props) => useTestShallowSimple(props), {
      initialProps,
    })

    expect(res.result.current.selectorOutput).toEqual(
      res.result.current.useShallowOutput
    )

    res.rerender({
      state: { a: 1, b: 2, c: 3 },
      selector: initialProps.selector,
    })

    expect(res.result.current.selectorOutput).toEqual(
      res.result.current.useShallowOutput
    )
  })

  it('returns the previously computed instance when possible', () => {
    const initialProps = {
      selector: Object.keys,
      state: { a: 1, b: 2 } as Record<string, number>,
    }

    const res = renderHook((props) => useTestShallowSimple(props), {
      initialProps,
    })

    const output1 = res.result.current.useShallowOutput

    res.rerender({
      state: initialProps.state,
      selector: (state: Record<string, number>) => Object.keys(state), // New selector instance
    })
    const output2 = res.result.current.useShallowOutput

    expect(output1).toBe(output2)
    res.rerender(initialProps)

    expect(res.result.current.useShallowOutput).toBe(output1)
  })

  it('only re-renders if selector output has changed according to shallow', () => {
    let countRenders = 0
    const store = create((): Record<string, unknown> => ({ a: 1, b: 2, c: 3 }))
    const TestShallow = ({
      selector = (state) => Object.keys(state).sort(),
    }: {
      selector?: (state: Record<string, unknown>) => string[]
    }) => {
      const output = useStore(store, useShallow(selector))

      ++countRenders

      return <div data-testid="test-shallow">{output.join(',')}</div>
    }

    expect(countRenders).toBe(0)
    const res = render(<TestShallow />)

    expect(countRenders).toBe(1)
    expect(res.getByTestId('test-shallow').textContent).toBe('a,b,c')

    act(() => {
      store.setState({ a: 4 }) // This will not cause a re-render.
    })

    expect(countRenders).toBe(1)

    act(() => {
      store.setState({ d: 10 }) // This will cause a re-render.
    })

    expect(countRenders).toBe(2)
    expect(res.getByTestId('test-shallow').textContent).toBe('a,b,c,d')
  })

  it('does not cause stale closure issues', () => {
    const store = create((): Record<string, unknown> => ({ a: 1, b: 2, c: 3 }))
    const TestShallowWithState = () => {
      const [count, setCount] = useState(0)
      const output = useStore(
        store,
        useShallow((state) => Object.keys(state).concat([count.toString()]))
      )

      return (
        <div
          data-testid="test-shallow"
          onClick={() => setCount((prev) => ++prev)}>
          {output.join(',')}
        </div>
      )
    }

    const res = render(<TestShallowWithState />)

    expect(res.getByTestId('test-shallow').textContent).toBe('a,b,c,0')

    fireEvent.click(res.getByTestId('test-shallow'))

    expect(res.getByTestId('test-shallow').textContent).toBe('a,b,c,1')
  })
})
