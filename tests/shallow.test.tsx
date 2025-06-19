import { useState } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { create } from 'zustand'
import { shallow, useShallow } from 'zustand/shallow'
import { createWithEqualityFn } from 'zustand/traditional'

describe('types', () => {
  it('works with useBoundStore and array selector (#1107)', () => {
    const useBoundStore = createWithEqualityFn(() => ({
      villages: [] as { name: string }[],
    }))
    const Component = () => {
      const villages = useBoundStore((state) => state.villages, shallow)
      return <>{villages.length}</>
    }
    expect(Component).toBeDefined()
  })

  it('works with useBoundStore and string selector (#1107)', () => {
    const useBoundStore = createWithEqualityFn(() => ({
      refetchTimestamp: '',
    }))
    const Component = () => {
      const refetchTimestamp = useBoundStore(
        (state) => state.refetchTimestamp,
        shallow,
      )
      return <>{refetchTimestamp.toUpperCase()}</>
    }
    expect(Component).toBeDefined()
  })
})

describe('useShallow', () => {
  const testUseShallowSimpleCallback = vi.fn()
  const TestUseShallowSimple = ({
    selector,
    state,
  }: {
    state: Record<string, unknown>
    selector: (state: Record<string, unknown>) => string[]
  }) => {
    const selectorOutput = selector(state)
    const useShallowOutput = useShallow(selector)(state)

    return (
      <div
        data-testid="test-shallow"
        onClick={() =>
          testUseShallowSimpleCallback({ selectorOutput, useShallowOutput })
        }
      />
    )
  }

  beforeEach(() => {
    testUseShallowSimpleCallback.mockClear()
  })

  it('input and output selectors always return shallow equal values', () => {
    const { rerender } = render(
      <TestUseShallowSimple state={{ a: 1, b: 2 }} selector={Object.keys} />,
    )

    expect(testUseShallowSimpleCallback).toHaveBeenCalledTimes(0)
    fireEvent.click(screen.getByTestId('test-shallow'))

    const firstRender = testUseShallowSimpleCallback.mock.lastCall?.[0]

    expect(testUseShallowSimpleCallback).toHaveBeenCalledTimes(1)
    expect(firstRender).toBeTruthy()
    expect(firstRender?.selectorOutput).toEqual(firstRender?.useShallowOutput)

    rerender(
      <TestUseShallowSimple
        state={{ a: 1, b: 2, c: 3 }}
        selector={Object.keys}
      />,
    )

    fireEvent.click(screen.getByTestId('test-shallow'))
    expect(testUseShallowSimpleCallback).toHaveBeenCalledTimes(2)

    const secondRender = testUseShallowSimpleCallback.mock.lastCall?.[0]

    expect(secondRender).toBeTruthy()
    expect(secondRender?.selectorOutput).toEqual(secondRender?.useShallowOutput)
  })

  it('returns the previously computed instance when possible', () => {
    const state = { a: 1, b: 2 }
    const { rerender } = render(
      <TestUseShallowSimple state={state} selector={Object.keys} />,
    )

    fireEvent.click(screen.getByTestId('test-shallow'))
    expect(testUseShallowSimpleCallback).toHaveBeenCalledTimes(1)
    const output1 =
      testUseShallowSimpleCallback.mock.lastCall?.[0]?.useShallowOutput
    expect(output1).toBeTruthy()

    // Change selector, same output
    rerender(
      <TestUseShallowSimple
        state={state}
        selector={(state) => Object.keys(state)}
      />,
    )

    fireEvent.click(screen.getByTestId('test-shallow'))
    expect(testUseShallowSimpleCallback).toHaveBeenCalledTimes(2)

    const output2 =
      testUseShallowSimpleCallback.mock.lastCall?.[0]?.useShallowOutput
    expect(output2).toBeTruthy()

    expect(output2).toBe(output1)
  })

  it('only re-renders if selector output has changed according to shallow', () => {
    let countRenders = 0
    const useMyStore = create(
      (): Record<string, unknown> => ({ a: 1, b: 2, c: 3 }),
    )
    const TestShallow = ({
      selector = (state) => Object.keys(state).sort(),
    }: {
      selector?: (state: Record<string, unknown>) => string[]
    }) => {
      const output = useMyStore(useShallow(selector))

      ++countRenders

      return <div data-testid="test-shallow">{output.join(',')}</div>
    }

    expect(countRenders).toBe(0)
    render(<TestShallow />)

    expect(countRenders).toBe(1)
    expect(screen.getByTestId('test-shallow')).toHaveTextContent('a,b,c')

    act(() => {
      useMyStore.setState({ a: 4 }) // This will not cause a re-render.
    })

    expect(countRenders).toBe(1)

    act(() => {
      useMyStore.setState({ d: 10 }) // This will cause a re-render.
    })

    expect(countRenders).toBe(2)
    expect(screen.getByTestId('test-shallow')).toHaveTextContent('a,b,c,d')
  })

  it('does not cause stale closure issues', () => {
    const useMyStore = create(
      (): Record<string, unknown> => ({ a: 1, b: 2, c: 3 }),
    )
    const TestShallowWithState = () => {
      const [count, setCount] = useState(0)
      const output = useMyStore(
        useShallow((state) => Object.keys(state).concat([count.toString()])),
      )

      return (
        <div
          data-testid="test-shallow"
          onClick={() => setCount((prev) => ++prev)}
        >
          {output.join(',')}
        </div>
      )
    }

    render(<TestShallowWithState />)

    expect(screen.getByTestId('test-shallow')).toHaveTextContent('a,b,c,0')

    fireEvent.click(screen.getByTestId('test-shallow'))

    expect(screen.getByTestId('test-shallow')).toHaveTextContent('a,b,c,1')
  })
})
