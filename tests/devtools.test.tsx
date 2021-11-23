import { devtools, redux } from 'zustand/middleware'
import create from 'zustand/vanilla'

let extensionSubscriber: ((message: any) => void) | undefined
let extension = {
  subscribe: jest.fn((f) => {
    extensionSubscriber = f
    return () => {}
  }),
  unsubscribe: jest.fn(),
  send: jest.fn(),
  init: jest.fn(),
  error: jest.fn(),
}
let extensionConnector = { connect: jest.fn(() => extension) }
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
  let options = { name: 'test', foo: 'bar' }
  let initialState = { count: 0 }
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
    let originalNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    let originalConsoleWarn = console.warn
    console.warn = jest.fn()

    create(devtools(() => ({ count: 0 })))
    expect(console.warn).toHaveBeenLastCalledWith(
      '[zustand devtools middleware] Please install/enable Redux devtools extension'
    )

    process.env.NODE_ENV = originalNodeEnv
    console.warn = originalConsoleWarn
  })

  it('does not warn if not in dev env', () => {
    let consoleWarn = jest.spyOn(console, 'warn')

    create(devtools(() => ({ count: 0 })))
    expect(consoleWarn).not.toBeCalled()

    consoleWarn.mockRestore()
  })

})

describe('When state changes...', () => {
  it("sends { type: setStateName ?? 'anonymous` } as the action with current state", () => {
    let api = create(
      devtools(() => ({ count: 0, foo: 'bar' }), { name: 'testOptionsName' })
    )
    api.setState({ count: 10 }, false, 'testSetStateName')
    expect(extension.send).toHaveBeenLastCalledWith(
      { type: 'testSetStateName' },
      { count: 10, foo: 'bar' }
    )
    api.setState({ count: 5 }, true)
    expect(extension.send).toHaveBeenLastCalledWith(
      { type: 'anonymous' },
      { count: 5 }
    )
  })
})

describe('when it receives an message of type...', () => {
  describe('ACTION...', () => {
    it('does nothing', () => {
      let initialState = { count: 0 }
      let api = create(devtools(() => initialState))
      let setState = jest.spyOn(api, 'setState')

      extensionSubscriber!({
        type: 'ACTION',
        payload: '{ "type": "INCREMENT" }',
      })

      expect(api.getState()).toBe(initialState)
      expect(setState).not.toBeCalled()
    })

    it('does nothing even if there is `api.dispatch`', () => {
      let initialState = { count: 0 }
      let api = create(devtools(() => initialState))
      api.dispatch = jest.fn()
      let setState = jest.spyOn(api, 'setState')

      extensionSubscriber!({
        type: 'ACTION',
        payload: '{ "type": "INCREMENT" }',
      })

      expect(api.getState()).toBe(initialState)
      expect(setState).not.toBeCalled()
      expect(api.dispatch).not.toBeCalled()
    })

    it('dispatches with `api.dispatch` when `api.dispatchFromDevtools` is set to true', () => {
      let initialState = { count: 0 }
      let api = create(devtools(() => initialState))
      api.dispatch = jest.fn()
      api.dispatchFromDevtools = true
      let setState = jest.spyOn(api, 'setState')

      extensionSubscriber!({
        type: 'ACTION',
        payload: '{ "type": "INCREMENT" }',
      })

      expect(api.getState()).toBe(initialState)
      expect(setState).not.toBeCalled()
      expect(api.dispatch).toHaveBeenLastCalledWith({ type: 'INCREMENT' })
    })

    it('does not throw for unsupported payload', () => {
      let initialState = { count: 0 }
      let api = create(devtools(() => initialState))
      api.dispatch = jest.fn()
      api.dispatchFromDevtools = true
      let setState = jest.spyOn(api, 'setState')
      let originalConsoleError = console.error
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
        '[zustand devtools middleware] Could not parse the received json',
        (() => {
          try {
            JSON.parse({ name: 'increment', args: [] } as unknown as string)
          } catch (e) {
            return e
          }
        })()
      )

      expect(api.getState()).toBe(initialState)
      expect(setState).not.toBeCalled()
      expect(api.dispatch).not.toBeCalled()

      console.error = originalConsoleError
    })
  })

  describe('DISPATCH and payload of type...', () => {
    it('RESET, it inits with initial state', () => {
      let initialState = { count: 0 }
      let api = create(devtools(() => initialState))
      api.setState({ count: 1 })

      extension.send.mockClear()
      extensionSubscriber!({ type: 'DISPATCH', payload: { type: 'RESET' } })

      expect(api.getState()).toStrictEqual(initialState)
      expect(extension.init).toHaveBeenLastCalledWith(initialState)
      expect(extension.send).not.toBeCalled()
    })

    it('COMMIT, it inits with current state', () => {
      let initialState = { count: 0 }
      let api = create(devtools(() => initialState))
      api.setState({ count: 2 })
      let currentState = api.getState()

      extension.send.mockClear()
      extensionSubscriber!({ type: 'DISPATCH', payload: { type: 'COMMIT' } })

      expect(extension.init).toHaveBeenLastCalledWith(currentState)
      expect(extension.send).not.toBeCalled()
    })

    describe('ROLLBACK...', () => {
      it('it replaces state (but preserves functions) without recording and inits with `message.state`', () => {
        let increment = () => {}
        let api = create(devtools(() => ({ count: 0, increment })))
        let newState = { foo: 'bar' }

        extension.send.mockClear()
        extensionSubscriber!({
          type: 'DISPATCH',
          payload: { type: 'ROLLBACK' },
          state: JSON.stringify(newState),
        })

        expect(api.getState()).toStrictEqual({ ...newState, increment })
        expect(extension.init).toHaveBeenLastCalledWith({
          ...newState,
          increment,
        })
        expect(extension.send).not.toBeCalled()
      })

      it('does not throw for unparsable `message.state`', () => {
        let increment = () => {}
        let initialState = { count: 0, increment }
        let api = create(devtools(() => initialState))
        let originalConsoleError = console.error
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
        expect(api.getState()).toBe(initialState)
        expect(extension.init).not.toBeCalled()
        expect(extension.send).not.toBeCalled()

        console.error = originalConsoleError
      })
    })

    describe('JUMP_TO_STATE...', () => {
      let increment = () => {}
      it('it replaces state (but preserves functions) without recording with `message.state`', () => {
        let api = create(devtools(() => ({ count: 0, increment })))
        let newState = { foo: 'bar' }

        extension.send.mockClear()
        extensionSubscriber!({
          type: 'DISPATCH',
          payload: { type: 'JUMP_TO_STATE' },
          state: JSON.stringify(newState),
        })
        expect(api.getState()).toStrictEqual({ ...newState, increment })
        expect(extension.send).not.toBeCalled()
      })

      it('does not throw for unparsable `message.state`', () => {
        let increment = () => {}
        let initialState = { count: 0, increment }
        let api = create(devtools(() => initialState))
        let originalConsoleError = console.error
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
        expect(api.getState()).toBe(initialState)
        expect(extension.send).not.toBeCalled()

        console.error = originalConsoleError
      })
    })

    describe('JUMP_TO_ACTION...', () => {
      it('it replaces state (but preserves functions) without recording with `message.state`', () => {
        let increment = () => {}
        let api = create(devtools(() => ({ count: 0, increment })))
        let newState = { foo: 'bar' }

        extension.send.mockClear()
        extensionSubscriber!({
          type: 'DISPATCH',
          payload: { type: 'JUMP_TO_ACTION' },
          state: JSON.stringify(newState),
        })
        expect(api.getState()).toStrictEqual({ ...newState, increment })
        expect(extension.send).not.toBeCalled()
      })

      it('does not throw for unparsable `message.state`', () => {
        let increment = () => {}
        let initialState = { count: 0, increment }
        let api = create(devtools(() => initialState))
        let originalConsoleError = console.error
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
        expect(api.getState()).toBe(initialState)
        expect(extension.send).not.toBeCalled()

        console.error = originalConsoleError
      })
    })

    it('IMPORT_STATE, it replaces state (but preserves functions) without recording and inits the last computedState', () => {
      let increment = () => {}
      let api = create(devtools(() => ({ count: 0, increment })))
      let nextLiftedState = {
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
      expect(api.getState()).toStrictEqual({
        ...nextLiftedState.computedStates.at(-1)!.state,
        increment,
      })
      expect(extension.send).toHaveBeenLastCalledWith(null, nextLiftedState)
    })

    it('PAUSE_RECORDING, it toggles the sending of actions', () => {
      let api = create(devtools(() => ({ count: 0 })))

      api.setState({ count: 1 }, false, 'increment')
      expect(extension.send).toHaveBeenLastCalledWith(
        { type: 'increment' },
        { count: 1 }
      )

      extensionSubscriber!({
        type: 'DISPATCH',
        payload: { type: 'PAUSE_RECORDING' },
      })

      api.setState({ count: 2 }, false, 'increment')
      expect(extension.send).toHaveBeenLastCalledWith(
        { type: 'increment' },
        { count: 1 }
      )

      extensionSubscriber!({
        type: 'DISPATCH',
        payload: { type: 'PAUSE_RECORDING' },
      })

      api.setState({ count: 3 }, false, 'increment')
      expect(extension.send).toHaveBeenLastCalledWith(
        { type: 'increment' },
        { count: 3 }
      )
    })
  })
})

it('works with redux middleware', () => {
  let api = create(
    devtools(
      redux(
        ({ count }, { type }: { type: 'INCREMENT' | 'DECREMENT' }) => ({
          count: count + (type === 'INCREMENT' ? 1 : -1),
        }),
        { count: 0 }
      )
    )
  )

  api.dispatch({ type: 'INCREMENT' })
  api.dispatch({ type: 'INCREMENT' })
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
  expect(api.getState()).toMatchObject({ count: 1 })
})
