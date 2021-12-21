import { devtools, redux } from 'zustand/middleware'
import create from 'zustand/vanilla'

let extensionSubscriber: ((message: unknown) => void) | undefined
const extension = {
  subscribe: jest.fn((f) => {
    extensionSubscriber = f
    return () => {}
  }),
  unsubscribe: jest.fn(),
  send: jest.fn(),
  init: jest.fn(),
  error: jest.fn(),
}
const extensionConnector = { connect: jest.fn(() => extension) }
;(window as any).__REDUX_DEVTOOLS_EXTENSION__ = extensionConnector

beforeEach(() => {
  extensionConnector.connect.mockClear()
  extension.subscribe.mockClear()
  extension.unsubscribe.mockClear()
  extension.send.mockClear()
  extension.init.mockClear()
  extension.error.mockClear()
  extensionSubscriber = undefined
})

it('connects to the extension by passing the options and initializes', () => {
  const options = { name: 'test', foo: 'bar' }
  const initialState = { count: 0 }
  create(devtools(() => initialState, options))

  expect(extensionConnector.connect).toHaveBeenLastCalledWith(options)
  expect(extension.init).toHaveBeenLastCalledWith(initialState)
})

describe('If there is no extension installed...', () => {
  beforeAll(() => {
    ;(window as any).__REDUX_DEVTOOLS_EXTENSION__ = undefined
  })
  afterAll(() => {
    ;(window as any).__REDUX_DEVTOOLS_EXTENSION__ = extensionConnector
  })

  it('does not throw', () => {
    expect(() => {
      create(devtools(() => ({ count: 0 })))
    }).not.toThrow()
  })

  it('warns in dev env', () => {
    const originalNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    const originalConsoleWarn = console.warn
    console.warn = jest.fn()

    create(devtools(() => ({ count: 0 })))
    expect(console.warn).toHaveBeenLastCalledWith(
      '[zustand devtools middleware] Please install/enable Redux devtools extension'
    )

    process.env.NODE_ENV = originalNodeEnv
    console.warn = originalConsoleWarn
  })

  it('does not warn if not in dev env', () => {
    const consoleWarn = jest.spyOn(console, 'warn')

    create(devtools(() => ({ count: 0 })))
    expect(consoleWarn).not.toBeCalled()

    consoleWarn.mockRestore()
  })
})

describe('When state changes...', () => {
  it("sends { type: setStateName || 'anonymous` } as the action with current state", () => {
    const store = create(
      devtools(() => ({ count: 0, foo: 'bar' }), { name: 'testOptionsName' })
    )
    store.setState({ count: 10 }, false, 'testSetStateName')
    expect(extension.send).toHaveBeenLastCalledWith(
      { type: 'testSetStateName' },
      { count: 10, foo: 'bar' }
    )
    store.setState({ count: 5 }, true)
    expect(extension.send).toHaveBeenLastCalledWith(
      { type: 'anonymous' },
      { count: 5 }
    )
  })
})

describe('when it receives an message of type...', () => {
  describe('ACTION...', () => {
    it('does nothing', () => {
      const initialState = { count: 0 }
      const store = create(devtools(() => initialState))
      const setState = jest.spyOn(store, 'setState')

      extensionSubscriber!({
        type: 'ACTION',
        payload: '{ "type": "INCREMENT" }',
      })

      expect(store.getState()).toBe(initialState)
      expect(setState).not.toBeCalled()
    })

    it('unless action type is __setState', () => {
      const initialState = { count: 0 }
      const store = create(devtools(() => initialState))

      extensionSubscriber!({
        type: 'ACTION',
        payload: '{ "type": "__setState", "state": { "foo": "bar" } }',
      })

      expect(store.getState()).toStrictEqual({ ...initialState, foo: 'bar' })
    })

    it('does nothing even if there is `store.dispatch`', () => {
      const initialState = { count: 0 }
      const store = create(devtools(() => initialState))
      ;(store as any).dispatch = jest.fn()
      const setState = jest.spyOn(store, 'setState')

      extensionSubscriber!({
        type: 'ACTION',
        payload: '{ "type": "INCREMENT" }',
      })

      expect(store.getState()).toBe(initialState)
      expect(setState).not.toBeCalled()
      expect((store as any).dispatch).not.toBeCalled()
    })

    it('dispatches with `store.dispatch` when `store.dispatchFromDevtools` is set to true', () => {
      const initialState = { count: 0 }
      const store = create(devtools(() => initialState))
      ;(store as any).dispatch = jest.fn()
      ;(store as any).dispatchFromDevtools = true
      const setState = jest.spyOn(store, 'setState')

      extensionSubscriber!({
        type: 'ACTION',
        payload: '{ "type": "INCREMENT" }',
      })

      expect(store.getState()).toBe(initialState)
      expect(setState).not.toBeCalled()
      expect((store as any).dispatch).toHaveBeenLastCalledWith({ type: 'INCREMENT' })
    })

    it('does not throw for unsupported payload', () => {
      const initialState = { count: 0 }
      const store = create(devtools(() => initialState))
      ;(store as any).dispatch = jest.fn()
      ;(store as any).dispatchFromDevtools = true
      const setState = jest.spyOn(store, 'setState')
      const originalConsoleError = console.error
      console.error = jest.fn()

      expect(() => {
        extensionSubscriber!({
          type: 'ACTION',
          payload: 'this.increment()',
        })
      }).not.toThrow()

      expect(console.error).toHaveBeenLastCalledWith(
        '[zustand devtools middleware] Could not parse the received json',
        (() => {
          try {
            JSON.parse('this.increment()')
          } catch (e) {
            return e
          }
        })()
      )

      expect(() => {
        extensionSubscriber!({
          type: 'ACTION',
          payload: { name: 'increment', args: [] },
        })
      }).not.toThrow()

      expect(console.error).toHaveBeenLastCalledWith(
        '[zustand devtools middleware] Unsupported action format'
      )

      expect(store.getState()).toBe(initialState)
      expect(setState).not.toBeCalled()
      expect((store as any).dispatch).not.toBeCalled()

      console.error = originalConsoleError
    })
  })

  describe('DISPATCH and payload of type...', () => {
    it('RESET, it inits with initial state', () => {
      const initialState = { count: 0 }
      const store = create(devtools(() => initialState))
      store.setState({ count: 1 })

      extension.send.mockClear()
      extensionSubscriber!({
        type: 'DISPATCH',
        payload: { type: 'RESET' },
      })

      expect(store.getState()).toStrictEqual(initialState)
      expect(extension.init).toHaveBeenLastCalledWith(initialState)
    })

    it('COMMIT, it inits with current state', () => {
      const initialState = { count: 0 }
      const store = create(devtools(() => initialState))
      store.setState({ count: 2 })
      const currentState = store.getState()

      extension.send.mockClear()
      extensionSubscriber!({
        type: 'DISPATCH',
        payload: { type: 'COMMIT' },
      })

      expect(extension.init).toHaveBeenLastCalledWith(currentState)
      expect(extension.send).not.toBeCalled()
    })

    describe('ROLLBACK...', () => {
      it('it updates state without recording and inits with `message.state`', () => {
        const initialState = { count: 0, increment: () => {} }
        const store = create(devtools(() => initialState))
        const newState = { foo: 'bar' }

        extension.send.mockClear()
        extensionSubscriber!({
          type: 'DISPATCH',
          payload: { type: 'ROLLBACK' },
          state: JSON.stringify(newState),
        })

        expect(store.getState()).toStrictEqual({ ...initialState, ...newState })
        expect(extension.init).toHaveBeenLastCalledWith({
          ...initialState,
          ...newState,
        })
        expect(extension.send).not.toBeCalled()
      })

      it('does not throw for unparsable `message.state`', () => {
        const increment = () => {}
        const initialState = { count: 0, increment }
        const store = create(devtools(() => initialState))
        const originalConsoleError = console.error
        console.error = jest.fn()

        extension.init.mockClear()
        extension.send.mockClear()
        extensionSubscriber!({
          type: 'DISPATCH',
          payload: { type: 'ROLLBACK' },
          state: 'foobar',
        })

        expect(console.error).toHaveBeenLastCalledWith(
          '[zustand devtools middleware] Could not parse the received json',
          (() => {
            try {
              JSON.parse('foobar')
            } catch (e) {
              return e
            }
          })()
        )
        expect(store.getState()).toBe(initialState)
        expect(extension.init).not.toBeCalled()
        expect(extension.send).not.toBeCalled()

        console.error = originalConsoleError
      })
    })

    describe('JUMP_TO_STATE...', () => {
      const increment = () => {}
      it('it updates state without recording with `message.state`', () => {
        const initialState = { count: 0, increment }
        const store = create(devtools(() => initialState))
        const newState = { foo: 'bar' }

        extension.send.mockClear()
        extensionSubscriber!({
          type: 'DISPATCH',
          payload: { type: 'JUMP_TO_STATE' },
          state: JSON.stringify(newState),
        })
        expect(store.getState()).toStrictEqual({ ...initialState, ...newState })
        expect(extension.send).not.toBeCalled()
      })

      it('does not throw for unparsable `message.state`', () => {
        const initialState = { count: 0, increment: () => {} }
        const store = create(devtools(() => initialState))
        const originalConsoleError = console.error
        console.error = jest.fn()

        extension.send.mockClear()
        extensionSubscriber!({
          type: 'DISPATCH',
          payload: { type: 'JUMP_TO_STATE' },
          state: 'foobar',
        })

        expect(console.error).toHaveBeenLastCalledWith(
          '[zustand devtools middleware] Could not parse the received json',
          (() => {
            try {
              JSON.parse('foobar')
            } catch (e) {
              return e
            }
          })()
        )
        expect(store.getState()).toBe(initialState)
        expect(extension.send).not.toBeCalled()

        console.error = originalConsoleError
      })
    })

    describe('JUMP_TO_ACTION...', () => {
      it('it updates state without recording with `message.state`', () => {
        const initialState = { count: 0, increment: () => {} }
        const store = create(devtools(() => initialState))
        const newState = { foo: 'bar' }

        extension.send.mockClear()
        extensionSubscriber!({
          type: 'DISPATCH',
          payload: { type: 'JUMP_TO_ACTION' },
          state: JSON.stringify(newState),
        })
        expect(store.getState()).toStrictEqual({ ...initialState, ...newState })
        expect(extension.send).not.toBeCalled()
      })

      it('does not throw for unparsable `message.state`', () => {
        const increment = () => {}
        const initialState = { count: 0, increment }
        const store = create(devtools(() => initialState))
        const originalConsoleError = console.error
        console.error = jest.fn()

        extension.send.mockClear()
        extensionSubscriber!({
          type: 'DISPATCH',
          payload: { type: 'JUMP_TO_ACTION' },
          state: 'foobar',
        })

        expect(console.error).toHaveBeenLastCalledWith(
          '[zustand devtools middleware] Could not parse the received json',
          (() => {
            try {
              JSON.parse('foobar')
            } catch (e) {
              return e
            }
          })()
        )
        expect(store.getState()).toBe(initialState)
        expect(extension.send).not.toBeCalled()

        console.error = originalConsoleError
      })
    })

    it('IMPORT_STATE, it updates state without recording and inits the last computedState', () => {
      const initialState = { count: 0, increment: () => {} }
      const store = create(devtools(() => initialState))
      const nextLiftedState = {
        computedStates: [{ state: { count: 4 } }, { state: { count: 5 } }],
      }

      extension.send.mockClear()
      extensionSubscriber!({
        type: 'DISPATCH',
        payload: {
          type: 'IMPORT_STATE',
          nextLiftedState,
        },
      })
      expect(store.getState()).toStrictEqual({
        ...initialState,
        ...nextLiftedState.computedStates.slice(-1)[0]?.state,
      })
      expect(extension.send).toHaveBeenLastCalledWith(null, nextLiftedState)
    })

    it('PAUSE_RECORDING, it toggles the sending of actions', () => {
      const store = create(devtools(() => ({ count: 0 })))

      store.setState({ count: 1 }, false, 'increment')
      expect(extension.send).toHaveBeenLastCalledWith(
        { type: 'increment' },
        { count: 1 }
      )
      extensionSubscriber!({
        type: 'DISPATCH',
        payload: { type: 'PAUSE_RECORDING' },
      })

      store.setState({ count: 2 }, false, 'increment')
      expect(extension.send).toHaveBeenLastCalledWith(
        { type: 'increment' },
        { count: 1 }
      )
      extensionSubscriber!({
        type: 'DISPATCH',
        payload: { type: 'PAUSE_RECORDING' },
      })

      store.setState({ count: 3 }, false, 'increment')
      expect(extension.send).toHaveBeenLastCalledWith(
        { type: 'increment' },
        { count: 3 }
      )
    })
  })
})

it('works with redux middleware', () => {
  const store = create(
    devtools(
      redux(
        ({ count }, { type }: { type: 'INCREMENT' | 'DECREMENT' }) => ({
          count: count + (type === 'INCREMENT' ? 1 : -1),
        }),
        { count: 0 }
      )
    )
  )

  store.dispatch({ type: 'INCREMENT' })
  store.dispatch({ type: 'INCREMENT' })
  extensionSubscriber!({
    type: 'ACTION',
    payload: JSON.stringify({ type: 'DECREMENT' }),
  })

  expect(extension.init.mock.calls).toMatchObject([[{ count: 0 }]])
  expect(extension.send.mock.calls).toMatchObject([
    [{ type: 'INCREMENT' }, { count: 1 }],
    [{ type: 'INCREMENT' }, { count: 2 }],
    [{ type: 'DECREMENT' }, { count: 1 }],
  ])
  expect(store.getState()).toMatchObject({ count: 1 })

  const originalConsoleWarn = console.warn
  console.warn = jest.fn()

  store.dispatch({ type: '__setState' as any })
  expect(console.warn).toHaveBeenLastCalledWith(
    '[zustand devtools middleware] "__setState" action type is reserved ' +
      'to set state from the devtools. Avoid using it.'
  )

  console.warn = originalConsoleWarn
})

it('works in non-browser env', () => {
  const originalWindow = global.window
  global.window = undefined as any

  expect(() => {
    create(devtools(() => ({ count: 0 })))
  }).not.toThrow()

  global.window = originalWindow
})
