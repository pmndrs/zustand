import React from 'react'
import { render } from '@testing-library/react'
import { devtools, combine } from '../src/middleware'
import create from '../src/index'

describe('devtools', () => {
  it('create store with devtools', async () => {
    // assert redux devtools
    ;(window as any).__REDUX_DEVTOOLS_EXTENSION__ = {
      connect(obj: any) {
        expect(obj.name).toBeUndefined()

        return {
          subscribe() {},
          init(initialState: any) {
            expect(initialState.count).toBe(0)
            expect(typeof initialState.inc).toBe('function')
          },
          send(action: string, payload: any) {
            expect(action).toBe('action')
            expect(payload.count).toBe(1)
            expect(typeof payload.inc).toBe('function')
          },
        }
      },
    }

    const useStore = create<any>(
      devtools((set) => ({
        count: 0,
        inc: () => set((state) => ({ count: state.count + 1 })),
      }))
    )

    function Counter() {
      const count = useStore((s) => s.count)
      const inc = useStore((s) => s.inc)
      React.useEffect(inc, [])
      return <div>count: {count}</div>
    }

    render(<Counter />)
  })

  it('create store with devtools and storeName', async () => {
    const storeName = 'counter'

    // assert redux devtools
    ;(window as any).__REDUX_DEVTOOLS_EXTENSION__ = {
      connect(obj: any) {
        expect(obj.name).toBe(storeName)

        return {
          init() {},
          subscribe() {},
          send(action: string) {
            expect(action).toBe(`${storeName} > action`)
          },
        }
      },
    }

    const useStore = create<any>(
      devtools(
        (set) => ({
          count: 0,
          inc: () => set((state) => ({ count: state.count + 1 })),
        }),
        storeName
      )
    )

    function Counter() {
      const count = useStore((s) => s.count)
      const inc = useStore((s) => s.inc)
      React.useEffect(inc, [])
      return <div>count: {count}</div>
    }

    render(<Counter />)
  })

  it('create store with devtools and custom action', async () => {
    const storeName = 'counter'
    const actionName = 'increment'

    // assert redux devtools
    ;(window as any).__REDUX_DEVTOOLS_EXTENSION__ = {
      connect(obj: any) {
        return {
          init() {},
          subscribe() {},
          send(action: string) {
            expect(action).toBe(`${storeName} > ${actionName}`)
          },
        }
      },
    }

    const useStore = create<any>(
      devtools(
        (set) => ({
          count: 0,
          inc: () =>
            set((state) => ({ count: state.count + 1 }), false, actionName),
        }),
        storeName
      )
    )

    function Counter() {
      const count = useStore((s) => s.count)
      const inc = useStore((s) => s.inc)
      React.useEffect(inc, [])
      return <div>count: {count}</div>
    }

    render(<Counter />)
  })

  it('create store with devtools and combine', async () => {
    const storeName = 'counter'
    const actionName = 'increment'

    const initialState = {
      count: 0,
    }

    // assert redux devtools
    ;(window as any).__REDUX_DEVTOOLS_EXTENSION__ = {
      connect(obj: any) {
        expect(obj.name).toBe(storeName)

        return {
          subscribe() {},
          init(state: any) {
            expect(JSON.stringify(state)).toBe(
              JSON.stringify({
                ...initialState,
                inc() {},
              })
            )
          },
          send(action: string) {
            expect(action).toBe(`${storeName} > ${actionName}`)
          },
        }
      },
    }

    const useStore = create<any>(
      devtools(
        combine(initialState, (set) => ({
          count: 0,
          inc: () =>
            set((state) => ({ count: state.count + 1 }), false, actionName),
        })),
        storeName
      )
    )

    function Counter() {
      const count = useStore((s) => s.count)
      const inc = useStore((s) => s.inc)
      React.useEffect(inc, [])
      return <div>count: {count}</div>
    }

    render(<Counter />)
  })
})
