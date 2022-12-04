import { StoreApi } from 'zustand/vanilla'

const connectionSubscribers = new Map<
  string | undefined,
  ((message: any) => void) | undefined
>()
const nameUndefinedConnectionSubscribers = new Map<
  string | undefined,
  ((message: any) => void) | undefined
>()
const connections = new Map<
  string | undefined,
  {
    subscribe: jest.Mock<() => void, [f: any]>
    unsubscribe: jest.Mock<any, any>
    send: jest.Mock<any, any>
    init: jest.Mock<any, any>
    error: jest.Mock<any, any>
  }
>()

const nameUndefinedConnections = new Map<
  string,
  {
    subscribe: jest.Mock<() => void, [f: any]>
    unsubscribe: jest.Mock<any, any>
    send: jest.Mock<any, any>
    init: jest.Mock<any, any>
    error: jest.Mock<any, any>
  }
>()

function getKeyFromOptions(options: any): string | undefined {
  let key: string | undefined = options?.name
  if (options?.testStore) {
    key = `${options?.name}|${options?.testStore}`
  }
  return key
}

const extensionConnector = {
  connect: jest.fn((options) => {
    const key = getKeyFromOptions(options)
    console.log('options', options)
    const areNameUndefinedMapsNeeded =
      options.testConnectionId !== undefined && options?.name === undefined
    const connection = {
      subscribe: jest.fn((f) => {
        if (areNameUndefinedMapsNeeded) {
          nameUndefinedConnectionSubscribers.set(options.testConnectionId, f)
          return () => {}
        }
        connectionSubscribers.set(key, f)
        return () => {}
      }),
      unsubscribe: jest.fn(),
      send: jest.fn(),
      init: jest.fn(),
      error: jest.fn(),
    }
    if (areNameUndefinedMapsNeeded) {
      nameUndefinedConnections.set(options.testConnectionId, connection)
    } else {
      connections.set(key, connection)
    }
    return connection
  }),
}
;(window as any).__REDUX_DEVTOOLS_EXTENSION__ = extensionConnector

beforeEach(() => {
  jest.resetModules()
  extensionConnector.connect.mockClear()
  connections.clear()
  nameUndefinedConnections.clear()
  connectionSubscribers.clear()
})

it('connects to the extension by passing the options and initializes', async () => {
  const { devtools } = await import('zustand/middleware')
  const create = await (await import('zustand/vanilla')).default
  const options = { name: 'test', foo: 'bar' }
  const initialState = { count: 0 }
  create(devtools(() => initialState, { enabled: true, ...options }))

  expect(extensionConnector.connect).toHaveBeenLastCalledWith(options)
  const conn = connections.get(options.name)
  if (undefined === conn) {
    throw new Error()
  }
  expect(conn.init).toHaveBeenLastCalledWith(initialState)
})

describe('If there is no extension installed...', () => {
  let savedConsoleWarn: any
  let savedDEV: boolean
  beforeEach(() => {
    savedConsoleWarn = console.warn
    console.warn = jest.fn()
    savedDEV = __DEV__
    ;(window as any).__REDUX_DEVTOOLS_EXTENSION__ = undefined
  })
  afterEach(() => {
    console.warn = savedConsoleWarn
    __DEV__ = savedDEV
    ;(window as any).__REDUX_DEVTOOLS_EXTENSION__ = extensionConnector
  })

  it('does not throw', async () => {
    const { devtools } = await import('zustand/middleware')
    const create = await (await import('zustand/vanilla')).default
    expect(() => {
      create(devtools(() => ({ count: 0 })))
    }).not.toThrow()
  })

  it('does not warn if not enabled', async () => {
    const { devtools } = await import('zustand/middleware')
    const create = await (await import('zustand/vanilla')).default
    create(devtools(() => ({ count: 0 })))
    expect(console.warn).not.toBeCalled()
  })

  it('[DEV-ONLY] warns if enabled in dev mode', async () => {
    const { devtools } = await import('zustand/middleware')
    const create = await (await import('zustand/vanilla')).default
    __DEV__ = true
    create(devtools(() => ({ count: 0 }), { enabled: true }))
    expect(console.warn).toBeCalled()
  })

  it('[PRD-ONLY] does not warn if not in dev env', async () => {
    const { devtools } = await import('zustand/middleware')
    const create = await (await import('zustand/vanilla')).default
    __DEV__ = false
    create(devtools(() => ({ count: 0 })))
    expect(console.warn).not.toBeCalled()
  })

  it('[PRD-ONLY] does not warn if not in dev env even if enabled', async () => {
    const { devtools } = await import('zustand/middleware')
    const create = await (await import('zustand/vanilla')).default
    __DEV__ = false
    create(devtools(() => ({ count: 0 }), { enabled: true }))
    expect(console.warn).not.toBeCalled()
  })
})

describe('When state changes...', () => {
  it("sends { type: setStateName || 'anonymous`, ...rest } as the action with current state", async () => {
    const { devtools } = await import('zustand/middleware')
    const create = await (await import('zustand/vanilla')).default
    const options = {
      name: 'testOptionsName',
      enabled: true,
    }
    const api = create(devtools(() => ({ count: 0, foo: 'bar' }), options))

    api.setState({ count: 10 }, false, 'testSetStateName')
    const connection = connections.get(options.name)
    if (undefined === connection) {
      throw new Error()
    }
    expect(connection.send).toHaveBeenLastCalledWith(
      { type: 'testSetStateName' },
      { count: 10, foo: 'bar' }
    )

    api.setState({ count: 15 }, false, {
      type: 'testSetStateName',
      payload: 15,
    })
    expect(connection.send).toHaveBeenLastCalledWith(
      { type: 'testSetStateName', payload: 15 },
      { count: 15, foo: 'bar' }
    )

    api.setState({ count: 5, foo: 'baz' }, true)
    expect(connection.send).toHaveBeenLastCalledWith(
      { type: 'anonymous' },
      { count: 5, foo: 'baz' }
    )
  })
})

describe('when it receives a message of type...', () => {
  describe('ACTION...', () => {
    it('does nothing', async () => {
      const { devtools } = await import('zustand/middleware')
      const create = await (await import('zustand/vanilla')).default
      const initialState = { count: 0 }
      const api = create(devtools(() => initialState, { enabled: true }))
      const setState = jest.spyOn(api, 'setState')

      const subscriber = connectionSubscribers.get(undefined)
      if (undefined === subscriber) {
        throw new Error()
      }
      ;(subscriber as (message: any) => void)({
        type: 'ACTION',
        payload: '{ "type": "INCREMENT" }',
      })

      expect(api.getState()).toBe(initialState)
      expect(setState).not.toBeCalled()
    })

    it('unless action type is __setState', async () => {
      const { devtools } = await import('zustand/middleware')
      const create = await (await import('zustand/vanilla')).default
      const initialState = { count: 0 }
      const api = create(devtools(() => initialState, { enabled: true }))

      const connectionSubscriber = connectionSubscribers.get(undefined)
      if (undefined === connectionSubscriber) {
        throw new Error()
      }
      ;(connectionSubscriber as (message: any) => void)({
        type: 'ACTION',
        payload: '{ "type": "__setState", "state": { "foo": "bar" } }',
      })

      expect(api.getState()).toStrictEqual({ ...initialState, foo: 'bar' })
    })

    it('does nothing even if there is `api.dispatch`', async () => {
      const { devtools } = await import('zustand/middleware')
      const create = await (await import('zustand/vanilla')).default
      const initialState = { count: 0 }
      const api = create(devtools(() => initialState, { enabled: true }))
      ;(api as any).dispatch = jest.fn()
      const setState = jest.spyOn(api, 'setState')

      const connectionSubscriber = connectionSubscribers.get(undefined)
      if (undefined === connectionSubscriber) {
        throw new Error()
      }
      ;(connectionSubscriber as (message: any) => void)({
        type: 'ACTION',
        payload: '{ "type": "INCREMENT" }',
      })

      expect(api.getState()).toBe(initialState)
      expect(setState).not.toBeCalled()
      expect((api as any).dispatch).not.toBeCalled()
    })

    it('dispatches with `api.dispatch` when `api.dispatchFromDevtools` is set to true', async () => {
      const { devtools } = await import('zustand/middleware')
      const create = await (await import('zustand/vanilla')).default
      const initialState = { count: 0 }
      const api = create(devtools(() => initialState, { enabled: true }))
      ;(api as any).dispatch = jest.fn()
      ;(api as any).dispatchFromDevtools = true
      const setState = jest.spyOn(api, 'setState')

      const connectionSubscriber = connectionSubscribers.get(undefined)
      if (undefined === connectionSubscriber) {
        throw new Error()
      }
      ;(connectionSubscriber as (message: any) => void)({
        type: 'ACTION',
        payload: '{ "type": "INCREMENT" }',
      })

      expect(api.getState()).toBe(initialState)
      expect(setState).not.toBeCalled()
      expect((api as any).dispatch).toHaveBeenLastCalledWith({
        type: 'INCREMENT',
      })
    })

    it('does not throw for unsupported payload', async () => {
      const { devtools } = await import('zustand/middleware')
      const create = await (await import('zustand/vanilla')).default
      const initialState = { count: 0 }
      const api = create(devtools(() => initialState, { enabled: true }))
      ;(api as any).dispatch = jest.fn()
      ;(api as any).dispatchFromDevtools = true
      const setState = jest.spyOn(api, 'setState')
      const originalConsoleError = console.error
      console.error = jest.fn()

      const connectionSubscriber = connectionSubscribers.get(undefined)
      if (undefined === connectionSubscriber) {
        throw new Error()
      }
      expect(() => {
        ;(connectionSubscriber as (message: any) => void)({
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
        ;(connectionSubscriber as (message: any) => void)({
          type: 'ACTION',
          payload: { name: 'increment', args: [] },
        })
      }).not.toThrow()

      expect(console.error).toHaveBeenLastCalledWith(
        '[zustand devtools middleware] Unsupported action format'
      )

      expect(api.getState()).toBe(initialState)
      expect(setState).not.toBeCalled()
      expect((api as any).dispatch).not.toBeCalled()

      console.error = originalConsoleError
    })
  })

  describe('DISPATCH and payload of type...', () => {
    it('RESET, it inits with initial state', async () => {
      const { devtools } = await import('zustand/middleware')
      const create = await (await import('zustand/vanilla')).default
      const initialState = { count: 0 }
      const api = create(devtools(() => initialState, { enabled: true }))
      api.setState({ count: 1 })

      const connection = connections.get(undefined)
      if (undefined === connection) {
        throw new Error()
      }
      connection.send.mockClear()
      const connectionSubscriber = connectionSubscribers.get(undefined)
      if (undefined === connectionSubscriber) {
        throw new Error()
      }
      ;(connectionSubscriber as (message: any) => void)({
        type: 'DISPATCH',
        payload: { type: 'RESET' },
      })

      expect(api.getState()).toStrictEqual(initialState)
      expect(connection.init).toHaveBeenLastCalledWith(initialState)
      expect(connection.send).not.toBeCalled()
    })

    it('COMMIT, it inits with current state', async () => {
      const { devtools } = await import('zustand/middleware')
      const create = await (await import('zustand/vanilla')).default
      const initialState = { count: 0 }
      const api = create(devtools(() => initialState, { enabled: true }))
      api.setState({ count: 2 })
      const currentState = api.getState()

      const connection = connections.get(undefined)
      if (undefined === connection) {
        throw new Error()
      }
      connection.send.mockClear()
      const connectionSubscriber = connectionSubscribers.get(undefined)
      if (undefined === connectionSubscriber) {
        throw new Error()
      }
      ;(connectionSubscriber as (message: any) => void)({
        type: 'DISPATCH',
        payload: { type: 'COMMIT' },
      })

      expect(connection.init).toHaveBeenLastCalledWith(currentState)
      expect(connection.send).not.toBeCalled()
    })

    describe('ROLLBACK...', () => {
      it('it updates state without recording and inits with `message.state`', async () => {
        const { devtools } = await import('zustand/middleware')
        const create = await (await import('zustand/vanilla')).default
        const initialState = { count: 0, increment: () => {} }
        const api = create(devtools(() => initialState, { enabled: true }))
        const newState = { foo: 'bar' }

        const connection = connections.get(undefined)
        if (undefined === connection) {
          throw new Error()
        }
        connection.send.mockClear()
        const connectionSubscriber = connectionSubscribers.get(undefined)
        if (undefined === connectionSubscriber) {
          throw new Error()
        }
        ;(connectionSubscriber as (message: any) => void)({
          type: 'DISPATCH',
          payload: { type: 'ROLLBACK' },
          state: JSON.stringify(newState),
        })

        expect(api.getState()).toStrictEqual({ ...initialState, ...newState })
        expect(connection.init).toHaveBeenLastCalledWith({
          ...initialState,
          ...newState,
        })
        expect(connection.send).not.toBeCalled()
      })

      it('does not throw for unparsable `message.state`', async () => {
        const { devtools } = await import('zustand/middleware')
        const create = await (await import('zustand/vanilla')).default
        const increment = () => {}
        const initialState = { count: 0, increment }
        const api = create(devtools(() => initialState, { enabled: true }))
        const originalConsoleError = console.error
        console.error = jest.fn()

        const connection = connections.get(undefined)
        if (undefined === connection) {
          throw new Error()
        }
        connection.init.mockClear()
        connection.send.mockClear()
        const connectionSubscriber = connectionSubscribers.get(undefined)
        if (undefined === connectionSubscriber) {
          throw new Error()
        }
        ;(connectionSubscriber as (message: any) => void)({
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
        expect(connection.init).not.toBeCalled()
        expect(connection.send).not.toBeCalled()

        console.error = originalConsoleError
      })
    })

    describe('JUMP_TO_STATE...', () => {
      const increment = () => {}
      it('it updates state without recording with `message.state`', async () => {
        const { devtools } = await import('zustand/middleware')
        const create = await (await import('zustand/vanilla')).default
        const initialState = { count: 0, increment }
        const api = create(devtools(() => initialState, { enabled: true }))
        const newState = { foo: 'bar' }

        const connection = connections.get(undefined)
        if (undefined === connection) {
          throw new Error()
        }
        connection.send.mockClear()
        const connectionSubscriber = connectionSubscribers.get(undefined)
        if (undefined === connectionSubscriber) {
          throw new Error()
        }
        ;(connectionSubscriber as (message: any) => void)({
          type: 'DISPATCH',
          payload: { type: 'JUMP_TO_STATE' },
          state: JSON.stringify(newState),
        })
        expect(api.getState()).toStrictEqual({ ...initialState, ...newState })
        expect(connection.send).not.toBeCalled()
      })

      it('does not throw for unparsable `message.state`', async () => {
        const { devtools } = await import('zustand/middleware')
        const create = await (await import('zustand/vanilla')).default
        const initialState = { count: 0, increment: () => {} }
        const api = create(devtools(() => initialState, { enabled: true }))
        const originalConsoleError = console.error
        console.error = jest.fn()

        const connection = connections.get(undefined)
        if (undefined === connection) {
          throw new Error()
        }
        connection.send.mockClear()
        const connectionSubscriber = connectionSubscribers.get(undefined)
        if (undefined === connectionSubscriber) {
          throw new Error()
        }
        ;(connectionSubscriber as (message: any) => void)({
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
        expect(connection.send).not.toBeCalled()

        console.error = originalConsoleError
      })
    })

    describe('JUMP_TO_ACTION...', () => {
      it('it updates state without recording with `message.state`', async () => {
        const { devtools } = await import('zustand/middleware')
        const create = await (await import('zustand/vanilla')).default
        const initialState = { count: 0, increment: () => {} }
        const api = create(devtools(() => initialState, { enabled: true }))
        const newState = { foo: 'bar' }

        const connection = connections.get(undefined)
        if (undefined === connection) {
          throw new Error()
        }
        connection.send.mockClear()
        const connectionSubscriber = connectionSubscribers.get(undefined)
        if (undefined === connectionSubscriber) {
          throw new Error()
        }
        ;(connectionSubscriber as (message: any) => void)({
          type: 'DISPATCH',
          payload: { type: 'JUMP_TO_ACTION' },
          state: JSON.stringify(newState),
        })
        expect(api.getState()).toStrictEqual({ ...initialState, ...newState })
        expect(connection.send).not.toBeCalled()
      })

      it('does not throw for unparsable `message.state`', async () => {
        const { devtools } = await import('zustand/middleware')
        const create = await (await import('zustand/vanilla')).default
        const increment = () => {}
        const initialState = { count: 0, increment }
        const api = create(devtools(() => initialState, { enabled: true }))
        const originalConsoleError = console.error
        console.error = jest.fn()

        const connection = connections.get(undefined)
        if (undefined === connection) {
          throw new Error()
        }
        connection.send.mockClear()
        const connectionSubscriber = connectionSubscribers.get(undefined)
        if (undefined === connectionSubscriber) {
          throw new Error()
        }
        ;(connectionSubscriber as (message: any) => void)({
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
        expect(connection.send).not.toBeCalled()

        console.error = originalConsoleError
      })
    })

    it('IMPORT_STATE, it updates state without recording and inits the last computedState', async () => {
      const { devtools } = await import('zustand/middleware')
      const create = await (await import('zustand/vanilla')).default
      const initialState = { count: 0, increment: () => {} }
      const api = create(devtools(() => initialState, { enabled: true }))
      const nextLiftedState = {
        computedStates: [{ state: { count: 4 } }, { state: { count: 5 } }],
      }

      const connection = connections.get(undefined)
      if (undefined === connection) {
        throw new Error()
      }
      connection.send.mockClear()
      const connectionSubscriber = connectionSubscribers.get(undefined)
      if (undefined === connectionSubscriber) {
        throw new Error()
      }
      ;(connectionSubscriber as (message: any) => void)({
        type: 'DISPATCH',
        payload: {
          type: 'IMPORT_STATE',
          nextLiftedState,
        },
      })
      expect(api.getState()).toStrictEqual({
        ...initialState,
        ...nextLiftedState.computedStates.slice(-1)[0]?.state,
      })
      expect(connection.send).toHaveBeenLastCalledWith(null, nextLiftedState)
    })

    it('PAUSE_RECORDING, it toggles the sending of actions', async () => {
      const { devtools } = await import('zustand/middleware')
      const create = await (await import('zustand/vanilla')).default
      const api = create(devtools(() => ({ count: 0 }), { enabled: true }))

      api.setState({ count: 1 }, false, 'increment')
      const connection = connections.get(undefined)
      if (undefined === connection) {
        throw new Error()
      }
      const connectionSubscriber = connectionSubscribers.get(undefined)
      if (undefined === connectionSubscriber) {
        throw new Error()
      }
      expect(connection.send).toHaveBeenLastCalledWith(
        { type: 'increment' },
        { count: 1 }
      )
      ;(connectionSubscriber as (message: any) => void)({
        type: 'DISPATCH',
        payload: { type: 'PAUSE_RECORDING' },
      })

      api.setState({ count: 2 }, false, 'increment')
      expect(connection.send).toHaveBeenLastCalledWith(
        { type: 'increment' },
        { count: 1 }
      )
      ;(connectionSubscriber as (message: any) => void)({
        type: 'DISPATCH',
        payload: { type: 'PAUSE_RECORDING' },
      })

      api.setState({ count: 3 }, false, 'increment')
      expect(connection.send).toHaveBeenLastCalledWith(
        { type: 'increment' },
        { count: 3 }
      )
    })
  })
})

describe('with redux middleware', () => {
  let api: StoreApi<{
    count: number
    dispatch: (
      action: { type: 'INCREMENT' } | { type: 'DECREMENT' }
    ) => { type: 'INCREMENT' } | { type: 'DECREMENT' }
  }>

  it('works as expected', async () => {
    const { devtools, redux } = await import('zustand/middleware')
    const create = await (await import('zustand/vanilla')).default
    api = create(
      devtools(
        redux(
          (
            { count },
            { type }: { type: 'INCREMENT' } | { type: 'DECREMENT' }
          ) => ({
            count: count + (type === 'INCREMENT' ? 1 : -1),
          }),
          { count: 0 }
        ),
        { enabled: true }
      )
    )
    ;(api as any).dispatch({ type: 'INCREMENT' })
    ;(api as any).dispatch({ type: 'INCREMENT' })
    const connection = connections.get(undefined)
    if (undefined === connection) {
      throw new Error()
    }
    const connectionSubscriber = connectionSubscribers.get(undefined)
    if (undefined === connectionSubscriber) {
      throw new Error()
    }
    ;(connectionSubscriber as (message: any) => void)({
      type: 'ACTION',
      payload: JSON.stringify({ type: 'DECREMENT' }),
    })

    expect(connection.init.mock.calls).toMatchObject([[{ count: 0 }]])
    expect(connection.send.mock.calls).toMatchObject([
      [{ type: 'INCREMENT' }, { count: 1 }],
      [{ type: 'INCREMENT' }, { count: 2 }],
      [{ type: 'DECREMENT' }, { count: 1 }],
    ])
    expect(api.getState()).toMatchObject({ count: 1 })
  })

  it('[DEV-ONLY] warns about misusage', () => {
    const originalConsoleWarn = console.warn
    console.warn = jest.fn()
    ;(api as any).dispatch({ type: '__setState' as any })
    expect(console.warn).toHaveBeenLastCalledWith(
      '[zustand devtools middleware] "__setState" action type is reserved ' +
        'to set state from the devtools. Avoid using it.'
    )

    console.warn = originalConsoleWarn
  })
})

it('works in non-browser env', async () => {
  const { devtools } = await import('zustand/middleware')
  const create = await (await import('zustand/vanilla')).default
  const originalWindow = global.window
  global.window = undefined as any

  expect(() => {
    create(devtools(() => ({ count: 0 }), { enabled: true }))
  }).not.toThrow()

  global.window = originalWindow
})

it('works in react native env', async () => {
  const { devtools } = await import('zustand/middleware')
  const create = await (await import('zustand/vanilla')).default
  const originalWindow = global.window
  global.window = {} as any

  expect(() => {
    create(devtools(() => ({ count: 0 }), { enabled: true }))
  }).not.toThrow()

  global.window = originalWindow
})

it('preserves isRecording after setting from devtools', async () => {
  const { devtools } = await import('zustand/middleware')
  const create = await (await import('zustand/vanilla')).default
  const api = create(devtools(() => ({ count: 0 }), { enabled: true }))
  const connection = connections.get(undefined)
  if (undefined === connection) {
    throw new Error()
  }
  const connectionSubscriber = connectionSubscribers.get(undefined)
  if (undefined === connectionSubscriber) {
    throw new Error()
  }
  ;(connectionSubscriber as (message: any) => void)({
    type: 'DISPATCH',
    payload: { type: 'PAUSE_RECORDING' },
  })
  ;(connectionSubscriber as (message: any) => void)({
    type: 'ACTION',
    payload: '{ "type": "__setState", "state": { "foo": "bar" } }',
  })

  api.setState({ count: 1 })
  expect(connection.send).not.toBeCalled()
})

/* features:
 * [] if name is undefined - use multiple devtools connections.
 * [] if name and store is defined - use connection for specific 'name'.
 * [] if two stores are coonected to one 'name' group and.
 *      another connected to another 'name' group, then feature should work
 * [] check actions with this feature, for multiple stores that store prefixes are added -
 * [] - reset
 * [] - commit
 * [] - rollback
 * [] - jump to state, jump to action
 * [] - import state
 **/

describe('when redux connection was called on multiple stores with `name` undefined in `devtools` options', () => {
  it('should create separate connection for each devtools store with .connect call', async () => {
    const { devtools } = await import('zustand/middleware')
    const create = await (await import('zustand/vanilla')).default
    const options1 = { foo: 'bar', testConnectionId: 'asdf' }
    const options2 = { foo: 'barr', testConnectionId: '123asd' }
    const initialState1 = { count: 0 }
    const initialState2 = { count1: 1 }

    create(devtools(() => initialState1, { enabled: true, ...options1 }))
    create(devtools(() => initialState2, { enabled: true, ...options2 }))

    expect(extensionConnector.connect).toHaveBeenNthCalledWith(1, options1)
    expect(extensionConnector.connect).toHaveBeenNthCalledWith(2, options2)
  })

  it('should call .init on each different connection object', async () => {
    const { devtools } = await import('zustand/middleware')
    const create = await (await import('zustand/vanilla')).default
    const options1 = { foo: 'bar', testConnectionId: 'asdf' }
    const options2 = { foo: 'barr', testConnectionId: '123asd' }
    const initialState1 = { count: 0 }
    const initialState2 = { count1: 1 }

    create(devtools(() => initialState1, { enabled: true, ...options1 }))
    create(devtools(() => initialState2, { enabled: true, ...options2 }))

    const conn1 = nameUndefinedConnections.get(options1.testConnectionId)
    const conn2 = nameUndefinedConnections.get(options2.testConnectionId)
    if (undefined === conn1 || undefined === conn2) {
      console.log('conn2', conn2)
      console.log('conn1', conn1)
      throw new Error()
    }
    expect(conn1.init).toHaveBeenLastCalledWith(initialState1)
    expect(conn2.init).toHaveBeenLastCalledWith(initialState2)
  })

  describe('when `store` property was provided in `devtools` call in options', () => {
    it('should create single connection for all indernal calls of .connect and `store` is not passed to .connect', async () => {
      const { devtools } = await import('zustand/middleware')
      const create = await (await import('zustand/vanilla')).default
      const options1 = { store: 'store1123', foo: 'bar1' }
      const options2 = { store: 'store2313132', foo: 'bar2' }
      const initialState1 = { count: 0 }
      const initialState2 = { count1: 1 }

      create(devtools(() => initialState1, { enabled: true, ...options1 }))
      create(devtools(() => initialState2, { enabled: true, ...options2 }))

      expect(extensionConnector.connect).toHaveBeenCalledTimes(1)
      expect(extensionConnector.connect).toHaveBeenCalledWith({
        foo: options1.foo,
      })
    })

    it('should call `.init` on single connection with combined states after each `create(devtools` call', async () => {
      const { devtools } = await import('zustand/middleware')
      const create = await (await import('zustand/vanilla')).default
      const options1 = { store: 'store12' }
      const options2 = { store: 'store21' }
      const initialState1 = { count1: 0 }
      const initialState2 = { count2: 1 }

      create(devtools(() => initialState1, { enabled: true, ...options1 }))
      create(devtools(() => initialState2, { enabled: true, ...options2 }))

      expect(extensionConnector.connect).toHaveBeenCalledTimes(1)
      const connection = connections.get(undefined)
      if (undefined === connection) {
        throw new Error()
      }
      expect(connection.init).toHaveBeenCalledTimes(2)
      expect(connection.init).toHaveBeenNthCalledWith(1, {
        [options1.store]: initialState1,
      })
      expect(connection.init).toHaveBeenNthCalledWith(2, {
        [options1.store]: initialState1,
        [options2.store]: initialState2,
      })
    })
  })
})

describe('when redux connection was called on multiple stores with `name` provided in `devtools` options', () => {
  describe('when same `name` is provided to all stores in devtools options', () => {
    it('should call .connect of redux extension with `name` that was passed from `devtools` options', async () => {
      const { devtools } = await import('zustand/middleware')
      const create = await (await import('zustand/vanilla')).default
      const connectionName = 'test'
      const options1 = { name: connectionName, store: 'store1123', foo: 'bar1' }
      const options2 = { name: connectionName, store: 'store1414', foo: 'bar1' }
      const initialState1 = { count: 0 }
      const initialState2 = { count: 2 }

      create(devtools(() => initialState1, { enabled: true, ...options1 }))
      create(devtools(() => initialState2, { enabled: true, ...options2 }))

      expect(extensionConnector.connect).toHaveBeenCalledTimes(1)
      expect(extensionConnector.connect).toHaveBeenCalledWith({
        foo: options1.foo,
        name: connectionName,
      })
    })
  })

  describe('when different `name` props were provided for different group of stores in devtools options', () => {
    it('should call .connect of redux extension with `name` that was passed from `devtools` options', async () => {
      const { devtools } = await import('zustand/middleware')
      const create = await (await import('zustand/vanilla')).default
      const connectionNameGroup1 = 'test1'
      const connectionNameGroup2 = 'test2'
      const options1 = {
        name: connectionNameGroup1,
        store: 'store1123',
        foo: 'bar2',
      }
      const options2 = {
        name: connectionNameGroup1,
        store: 'store1232',
        foo: 'bar3',
      }
      const options3 = {
        name: connectionNameGroup2,
        store: 'store61661',
        foo: 'bar4',
      }
      const options4 = {
        name: connectionNameGroup2,
        store: 'store14632',
        foo: 'bar5',
      }
      const initialState1 = { count: 0 }
      const initialState2 = { count: 2 }
      const initialState3 = { count: 5 }
      const initialState4 = { count: 7 }

      create(devtools(() => initialState1, { enabled: true, ...options1 }))
      create(devtools(() => initialState2, { enabled: true, ...options2 }))
      create(devtools(() => initialState3, { enabled: true, ...options3 }))
      create(devtools(() => initialState4, { enabled: true, ...options4 }))

      expect(extensionConnector.connect).toHaveBeenCalledTimes(2)
      expect(extensionConnector.connect).toHaveBeenNthCalledWith(1, {
        foo: options1.foo,
        name: connectionNameGroup1,
      })
      expect(extensionConnector.connect).toHaveBeenNthCalledWith(2, {
        foo: options3.foo,
        name: connectionNameGroup2,
      })
    })

    it('should call `.init` on single connection with combined states after each `create(devtools` call', async () => {
      const { devtools } = await import('zustand/middleware')
      const create = await (await import('zustand/vanilla')).default
      const connectionNameGroup1 = 'test1'
      const connectionNameGroup2 = 'test2'
      const options1 = {
        name: connectionNameGroup1,
        store: 'store1123',
        foo: 'bar2',
      }
      const options2 = {
        name: connectionNameGroup1,
        store: 'store1232',
        foo: 'bar3',
      }
      const options3 = {
        name: connectionNameGroup2,
        store: 'store61661',
        foo: 'bar4',
      }
      const options4 = {
        name: connectionNameGroup2,
        store: 'store14632',
        foo: 'bar5',
      }
      const initialState1 = { count: 0 }
      const initialState2 = { count: 2 }
      const initialState3 = { count: 5 }
      const initialState4 = { count: 7 }

      create(devtools(() => initialState1, { enabled: true, ...options1 }))
      create(devtools(() => initialState2, { enabled: true, ...options2 }))
      create(devtools(() => initialState3, { enabled: true, ...options3 }))
      create(devtools(() => initialState4, { enabled: true, ...options4 }))

      expect(extensionConnector.connect).toHaveBeenCalledTimes(2)
      const connection1 = connections.get(connectionNameGroup1)
      const connection2 = connections.get(connectionNameGroup2)
      if (undefined === connection1 || undefined === connection2) {
        throw new Error()
      }
      expect(connection1.init).toHaveBeenCalledTimes(2)
      expect(connection1.init).toHaveBeenNthCalledWith(1, {
        [options1.store]: initialState1,
      })
      expect(connection1.init).toHaveBeenNthCalledWith(2, {
        [options1.store]: initialState1,
        [options2.store]: initialState2,
      })
      expect(connection2.init).toHaveBeenCalledTimes(2)
      expect(connection2.init).toHaveBeenNthCalledWith(1, {
        [options3.store]: initialState3,
      })
      expect(connection2.init).toHaveBeenNthCalledWith(2, {
        [options3.store]: initialState3,
        [options4.store]: initialState4,
      })
    })

    it('preserves isRecording after setting from devtools on proper connection subscriber', async () => {
      const { devtools } = await import('zustand/middleware')
      const create = await (await import('zustand/vanilla')).default
      const options1 = { name: 'asdf1' }
      const options2 = { name: 'asdf2' }
      const api1 = create(
        devtools(() => ({ count: 0 }), { enabled: true, ...options1 })
      )
      create(devtools(() => ({ count: 0 }), { enabled: true, ...options2 }))
      const connection1 = connections.get(options1.name)
      const connection2 = connections.get(options2.name)
      if (undefined === connection1 || undefined === connection2) {
        throw new Error()
      }
      const connectionSubscriber1 = connectionSubscribers.get(options1.name)
      if (undefined === connectionSubscriber1) {
        throw new Error()
      }
      ;(connectionSubscriber1 as (message: any) => void)({
        type: 'DISPATCH',
        payload: { type: 'PAUSE_RECORDING' },
      })
      ;(connectionSubscriber1 as (message: any) => void)({
        type: 'ACTION',
        payload: '{ "type": "__setState", "state": { "foo": "bar" } }',
      })

      api1.setState({ count: 1 })
      expect(connection1.send).not.toBeCalled()
      expect(connection2.send).not.toBeCalled()
    })

    describe('with redux middleware', () => {
      let api1: StoreApi<{
        count: number
        dispatch: (
          action: { type: 'INCREMENT' } | { type: 'DECREMENT' }
        ) => { type: 'INCREMENT' } | { type: 'DECREMENT' }
      }>
      let api2: StoreApi<{
        count: number
        dispatch: (
          action: { type: 'INCREMENT' } | { type: 'DECREMENT' }
        ) => { type: 'INCREMENT' } | { type: 'DECREMENT' }
      }>

      it('works as expected', async () => {
        const { devtools, redux } = await import('zustand/middleware')
        const create = await (await import('zustand/vanilla')).default
        const options1 = { testConnectionId: 'asdf' }
        const options2 = { testConnectionId: '2f' }
        api1 = create(
          devtools(
            redux(
              (
                { count },
                { type }: { type: 'INCREMENT' } | { type: 'DECREMENT' }
              ) => ({
                count: count + (type === 'INCREMENT' ? 1 : -1),
              }),
              { count: 0 }
            ),
            { enabled: true, ...options1 }
          )
        )
        api2 = create(
          devtools(
            redux(
              (
                { count },
                { type }: { type: 'INCREMENT' } | { type: 'DECREMENT' }
              ) => ({
                count: count + (type === 'INCREMENT' ? 1 : -1),
              }),
              { count: 10 }
            ),
            { enabled: true, ...options2 }
          )
        )
        ;(api1 as any).dispatch({ type: 'INCREMENT' })
        ;(api1 as any).dispatch({ type: 'INCREMENT' })
        ;(api2 as any).dispatch({ type: 'INCREMENT' })
        ;(api2 as any).dispatch({ type: 'INCREMENT' })
        const connection1 = nameUndefinedConnections.get(
          options1.testConnectionId
        )
        const connection2 = nameUndefinedConnections.get(
          options2.testConnectionId
        )
        if (undefined === connection1 || undefined === connection2) {
          throw new Error()
        }
        const connectionSubscriber1 = nameUndefinedConnectionSubscribers.get(
          options1.testConnectionId
        )
        const connectionSubscriber2 = nameUndefinedConnectionSubscribers.get(
          options2.testConnectionId
        )
        if (
          undefined === connectionSubscriber1 ||
          undefined === connectionSubscriber2
        ) {
          throw new Error()
        }
        ;(connectionSubscriber1 as (message: any) => void)({
          type: 'ACTION',
          payload: JSON.stringify({ type: 'DECREMENT' }),
        })
        ;(connectionSubscriber2 as (message: any) => void)({
          type: 'ACTION',
          payload: JSON.stringify({ type: 'DECREMENT' }),
        })

        expect(connection1.init.mock.calls).toMatchObject([[{ count: 0 }]])
        expect(connection2.init.mock.calls).toMatchObject([[{ count: 10 }]])
        expect(connection1.send.mock.calls).toMatchObject([
          [{ type: 'INCREMENT' }, { count: 1 }],
          [{ type: 'INCREMENT' }, { count: 2 }],
          [{ type: 'DECREMENT' }, { count: 1 }],
        ])
        expect(connection2.send.mock.calls).toMatchObject([
          [{ type: 'INCREMENT' }, { count: 11 }],
          [{ type: 'INCREMENT' }, { count: 12 }],
          [{ type: 'DECREMENT' }, { count: 11 }],
        ])
        expect(api1.getState()).toMatchObject({ count: 1 })
        expect(api2.getState()).toMatchObject({ count: 11 })
      })
    })
  })
})

describe('when create devtools was called multiple times with `name` option undefined', () => {
  describe('When state changes...', () => {
    it("sends { type: setStateName || 'anonymous`, ...rest } as the action with current state, isolated from other connections", async () => {
      const { devtools } = await import('zustand/middleware')
      const create = await (await import('zustand/vanilla')).default
      const options1 = {
        enabled: true,
        testConnectionId: '123',
      }
      const options2 = {
        enabled: true,
        testConnectionId: '324',
      }
      const options3 = {
        enabled: true,
        testConnectionId: '412',
      }
      const api1 = create(devtools(() => ({ count: 0, foo: 'bar' }), options1))
      create(devtools(() => ({ count: 0, foo: 'bar1' }), options2))
      create(devtools(() => ({ count: 0, foo: 'bar2' }), options3))

      api1.setState({ count: 10 }, false, 'testSetStateName')
      const connection1 = nameUndefinedConnections.get(
        options1.testConnectionId
      )
      const connection2 = nameUndefinedConnections.get(
        options2.testConnectionId
      )
      const connection3 = nameUndefinedConnections.get(
        options3.testConnectionId
      )
      if (
        undefined === connection1 ||
        undefined === connection2 ||
        undefined === connection3
      ) {
        throw new Error()
      }
      expect(connection1.send).toHaveBeenLastCalledWith(
        { type: 'testSetStateName' },
        { count: 10, foo: 'bar' }
      )
      expect(connection2.send).not.toBeCalled()
      expect(connection3.send).not.toBeCalled()

      api1.setState({ count: 15 }, false, {
        type: 'testSetStateName',
        payload: 15,
      })
      expect(connection1.send).toHaveBeenLastCalledWith(
        { type: 'testSetStateName', payload: 15 },
        { count: 15, foo: 'bar' }
      )
      expect(connection2.send).not.toBeCalled()
      expect(connection3.send).not.toBeCalled()

      api1.setState({ count: 5, foo: 'baz' }, true)
      expect(connection1.send).toHaveBeenLastCalledWith(
        { type: 'anonymous' },
        { count: 5, foo: 'baz' }
      )
      expect(connection2.send).not.toBeCalled()
      expect(connection3.send).not.toBeCalled()
    })
  })

  describe('when it receives a message of type...', () => {
    describe('ACTION...', () => {
      it('does nothing, connections isolated from each other', async () => {
        const { devtools } = await import('zustand/middleware')
        const create = await (await import('zustand/vanilla')).default
        const options1 = { testConnectionId: '123' }
        const options2 = { testConnectionId: '231' }
        const options3 = { testConnectionId: '4342' }
        const initialState1 = { count: 0 }
        const initialState2 = { count: 2 }
        const initialState3 = { count: 3 }
        const api1 = create(
          devtools(() => initialState1, {
            enabled: true,
            ...options1,
          })
        )
        const api2 = create(
          devtools(() => initialState2, {
            enabled: true,
            ...options2,
          })
        )
        const api3 = create(
          devtools(() => initialState3, {
            enabled: true,
            ...options3,
          })
        )
        const setState1 = jest.spyOn(api1, 'setState')
        const setState2 = jest.spyOn(api2, 'setState')
        const setState3 = jest.spyOn(api3, 'setState')

        const subscriber = nameUndefinedConnectionSubscribers.get(
          options1.testConnectionId
        )
        if (undefined === subscriber) {
          throw new Error()
        }
        ;(subscriber as (message: any) => void)({
          type: 'ACTION',
          payload: '{ "type": "INCREMENT" }',
        })

        expect(api1.getState()).toBe(initialState1)
        expect(api2.getState()).toBe(initialState2)
        expect(api3.getState()).toBe(initialState3)
        expect(setState1).not.toBeCalled()
        expect(setState2).not.toBeCalled()
        expect(setState3).not.toBeCalled()
      })

      it('unless action type is __setState, connections isolated from each other', async () => {
        const { devtools } = await import('zustand/middleware')
        const create = await (await import('zustand/vanilla')).default
        const options1 = { testConnectionId: 'asdf' }
        const options2 = { testConnectionId: '2f' }
        const options3 = { testConnectionId: 'd2e' }
        const initialState1 = { count: 0 }
        const initialState2 = { count: 2 }
        const initialState3 = { count: 5 }
        const api1 = create(
          devtools(() => initialState1, { enabled: true, ...options1 })
        )
        const api2 = create(
          devtools(() => initialState2, { enabled: true, ...options2 })
        )
        const api3 = create(
          devtools(() => initialState3, { enabled: true, ...options3 })
        )

        const connectionSubscriber = nameUndefinedConnectionSubscribers.get(
          options1.testConnectionId
        )
        if (undefined === connectionSubscriber) {
          throw new Error()
        }
        ;(connectionSubscriber as (message: any) => void)({
          type: 'ACTION',
          payload: '{ "type": "__setState", "state": { "foo": "bar" } }',
        })

        expect(api1.getState()).toStrictEqual({ ...initialState1, foo: 'bar' })
        expect(api2.getState()).toStrictEqual({ ...initialState2 })
        expect(api3.getState()).toStrictEqual({ ...initialState3 })
      })

      it('does nothing even if there is `api.dispatch`, connections isolated from each other', async () => {
        const { devtools } = await import('zustand/middleware')
        const create = await (await import('zustand/vanilla')).default
        const options1 = { testConnectionId: 'asdf' }
        const options2 = { testConnectionId: '2f' }
        const options3 = { testConnectionId: 'd2e' }
        const initialState1 = { count: 0 }
        const initialState2 = { count: 2 }
        const initialState3 = { count: 5 }
        const api1 = create(
          devtools(() => initialState1, { enabled: true, ...options1 })
        )
        const api2 = create(
          devtools(() => initialState2, { enabled: true, ...options2 })
        )
        const api3 = create(
          devtools(() => initialState3, { enabled: true, ...options3 })
        )
        ;(api1 as any).dispatch = jest.fn()
        ;(api2 as any).dispatch = jest.fn()
        ;(api3 as any).dispatch = jest.fn()
        const setState1 = jest.spyOn(api1, 'setState')
        const setState2 = jest.spyOn(api2, 'setState')
        const setState3 = jest.spyOn(api3, 'setState')

        const connectionSubscriber1 = nameUndefinedConnectionSubscribers.get(
          options1.testConnectionId
        )
        const connectionSubscriber2 = nameUndefinedConnectionSubscribers.get(
          options2.testConnectionId
        )
        const connectionSubscriber3 = nameUndefinedConnectionSubscribers.get(
          options3.testConnectionId
        )
        if (
          undefined === connectionSubscriber1 ||
          undefined === connectionSubscriber2 ||
          undefined === connectionSubscriber3
        ) {
          throw new Error()
        }
        const testPayload = {
          type: 'ACTION',
          payload: '{ "type": "INCREMENT" }',
        }
        ;(connectionSubscriber1 as (message: any) => void)(testPayload)
        ;(connectionSubscriber2 as (message: any) => void)(testPayload)
        ;(connectionSubscriber3 as (message: any) => void)(testPayload)

        expect(api1.getState()).toBe(initialState1)
        expect(api2.getState()).toBe(initialState2)
        expect(api3.getState()).toBe(initialState3)
        expect(setState1).not.toBeCalled()
        expect(setState2).not.toBeCalled()
        expect(setState3).not.toBeCalled()
        expect((api1 as any).dispatch).not.toBeCalled()
        expect((api2 as any).dispatch).not.toBeCalled()
        expect((api3 as any).dispatch).not.toBeCalled()
      })

      it('dispatches with `api.dispatch` when `api.dispatchFromDevtools` is set to true, connections are isolated from each other', async () => {
        const { devtools } = await import('zustand/middleware')
        const create = await (await import('zustand/vanilla')).default
        const options1 = { testConnectionId: 'asdf' }
        const options2 = { testConnectionId: '2f' }
        const options3 = { testConnectionId: 'd2e' }
        const initialState1 = { count: 0 }
        const initialState2 = { count: 2 }
        const initialState3 = { count: 5 }
        const api1 = create(
          devtools(() => initialState1, { enabled: true, ...options1 })
        )
        const api2 = create(
          devtools(() => initialState2, { enabled: true, ...options2 })
        )
        const api3 = create(
          devtools(() => initialState3, { enabled: true, ...options3 })
        )
        ;(api1 as any).dispatch = jest.fn()
        ;(api1 as any).dispatchFromDevtools = true
        ;(api2 as any).dispatch = jest.fn()
        ;(api2 as any).dispatchFromDevtools = true
        ;(api3 as any).dispatch = jest.fn()
        ;(api3 as any).dispatchFromDevtools = true
        const setState1 = jest.spyOn(api1, 'setState')
        const setState2 = jest.spyOn(api2, 'setState')
        const setState3 = jest.spyOn(api3, 'setState')

        const connectionSubscriber1 = nameUndefinedConnectionSubscribers.get(
          options1.testConnectionId
        )
        const connectionSubscriber2 = nameUndefinedConnectionSubscribers.get(
          options2.testConnectionId
        )
        const connectionSubscriber3 = nameUndefinedConnectionSubscribers.get(
          options3.testConnectionId
        )
        if (
          undefined === connectionSubscriber1 ||
          undefined === connectionSubscriber2 ||
          undefined === connectionSubscriber3
        ) {
          throw new Error()
        }
        const getTestPayload = (n: number) => ({
          type: 'ACTION',
          payload: `{ "type": "INCREMENT${n}" }`,
        })
        ;(connectionSubscriber1 as (message: any) => void)(getTestPayload(1))
        ;(connectionSubscriber2 as (message: any) => void)(getTestPayload(2))
        ;(connectionSubscriber3 as (message: any) => void)(getTestPayload(3))

        expect(api1.getState()).toBe(initialState1)
        expect(api2.getState()).toBe(initialState2)
        expect(api3.getState()).toBe(initialState3)
        expect(setState1).not.toBeCalled()
        expect(setState2).not.toBeCalled()
        expect(setState3).not.toBeCalled()
        expect((api1 as any).dispatch).toHaveBeenLastCalledWith({
          type: 'INCREMENT1',
        })
        expect((api2 as any).dispatch).toHaveBeenLastCalledWith({
          type: 'INCREMENT2',
        })
        expect((api3 as any).dispatch).toHaveBeenLastCalledWith({
          type: 'INCREMENT3',
        })
      })

      it('does not throw for unsupported payload, connections are isolated from each other', async () => {
        const { devtools } = await import('zustand/middleware')
        const create = await (await import('zustand/vanilla')).default
        const options1 = { testConnectionId: 'asdf' }
        const options2 = { testConnectionId: '2f' }
        const options3 = { testConnectionId: 'd2e' }
        const initialState1 = { count: 0 }
        const initialState2 = { count: 2 }
        const initialState3 = { count: 5 }
        const api1 = create(
          devtools(() => initialState1, { enabled: true, ...options1 })
        )
        const api2 = create(
          devtools(() => initialState2, { enabled: true, ...options2 })
        )
        const api3 = create(
          devtools(() => initialState3, { enabled: true, ...options3 })
        )
        ;(api1 as any).dispatch = jest.fn()
        ;(api1 as any).dispatchFromDevtools = true
        ;(api2 as any).dispatch = jest.fn()
        ;(api2 as any).dispatchFromDevtools = true
        ;(api3 as any).dispatch = jest.fn()
        ;(api3 as any).dispatchFromDevtools = true
        const setState1 = jest.spyOn(api1, 'setState')
        const setState2 = jest.spyOn(api2, 'setState')
        const setState3 = jest.spyOn(api3, 'setState')
        const originalConsoleError = console.error
        console.error = jest.fn()

        const connectionSubscriber1 = nameUndefinedConnectionSubscribers.get(
          options1.testConnectionId
        )
        const connectionSubscriber2 = nameUndefinedConnectionSubscribers.get(
          options2.testConnectionId
        )
        const connectionSubscriber3 = nameUndefinedConnectionSubscribers.get(
          options3.testConnectionId
        )
        if (
          undefined === connectionSubscriber1 ||
          undefined === connectionSubscriber2 ||
          undefined === connectionSubscriber3
        ) {
          throw new Error()
        }
        expect(() => {
          ;(connectionSubscriber1 as (message: any) => void)({
            type: 'ACTION',
            payload: 'this.increment1()',
          })
        }).not.toThrow()
        expect(console.error).toHaveBeenNthCalledWith(
          1,
          '[zustand devtools middleware] Could not parse the received json',
          (() => {
            try {
              JSON.parse('this.increment1()')
            } catch (e) {
              return e
            }
          })()
        )

        expect(() => {
          ;(connectionSubscriber1 as (message: any) => void)({
            type: 'ACTION',
            payload: 'this.increment2()',
          })
        }).not.toThrow()
        expect(console.error).toHaveBeenNthCalledWith(
          2,
          '[zustand devtools middleware] Could not parse the received json',
          (() => {
            try {
              JSON.parse('this.increment2()')
            } catch (e) {
              return e
            }
          })()
        )

        expect(() => {
          ;(connectionSubscriber1 as (message: any) => void)({
            type: 'ACTION',
            payload: 'this.increment3()',
          })
        }).not.toThrow()
        expect(console.error).toHaveBeenNthCalledWith(
          3,
          '[zustand devtools middleware] Could not parse the received json',
          (() => {
            try {
              JSON.parse('this.increment3()')
            } catch (e) {
              return e
            }
          })()
        )

        expect(() => {
          ;(connectionSubscriber1 as (message: any) => void)({
            type: 'ACTION',
            payload: { name: 'increment', args: [] },
          })
        }).not.toThrow()
        expect(console.error).toHaveBeenNthCalledWith(
          4,
          '[zustand devtools middleware] Unsupported action format'
        )
        expect(() => {
          ;(connectionSubscriber2 as (message: any) => void)({
            type: 'ACTION',
            payload: { name: 'increment', args: [] },
          })
        }).not.toThrow()
        expect(console.error).toHaveBeenNthCalledWith(
          5,
          '[zustand devtools middleware] Unsupported action format'
        )
        expect(() => {
          ;(connectionSubscriber3 as (message: any) => void)({
            type: 'ACTION',
            payload: { name: 'increment', args: [] },
          })
        }).not.toThrow()
        expect(console.error).toHaveBeenNthCalledWith(
          6,
          '[zustand devtools middleware] Unsupported action format'
        )

        expect(api1.getState()).toBe(initialState1)
        expect(api2.getState()).toBe(initialState2)
        expect(api3.getState()).toBe(initialState3)
        expect(setState1).not.toBeCalled()
        expect(setState2).not.toBeCalled()
        expect(setState3).not.toBeCalled()
        expect((api1 as any).dispatch).not.toBeCalled()
        expect((api2 as any).dispatch).not.toBeCalled()
        expect((api3 as any).dispatch).not.toBeCalled()

        console.error = originalConsoleError
      })
    })

    describe('DISPATCH and payload of type...', () => {
      it('RESET, it inits with initial state, connections are isolated from each other', async () => {
        const { devtools } = await import('zustand/middleware')
        const create = await (await import('zustand/vanilla')).default
        const options1 = { testConnectionId: 'asdf' }
        const options2 = { testConnectionId: '2f' }
        const options3 = { testConnectionId: 'd2e' }
        const initialState1 = { count: 0 }
        const initialState2 = { count: 2 }
        const initialState3 = { count: 5 }
        const api1 = create(
          devtools(() => initialState1, { enabled: true, ...options1 })
        )
        const api2 = create(
          devtools(() => initialState2, { enabled: true, ...options2 })
        )
        const api3 = create(
          devtools(() => initialState3, { enabled: true, ...options3 })
        )
        api1.setState({ count: 1 })
        api2.setState({ count: 3 })
        api3.setState({ count: 10 })

        const connection1 = nameUndefinedConnections.get(
          options1.testConnectionId
        )
        const connection2 = nameUndefinedConnections.get(
          options2.testConnectionId
        )
        const connection3 = nameUndefinedConnections.get(
          options3.testConnectionId
        )
        if (
          undefined === connection1 ||
          undefined === connection2 ||
          undefined === connection3
        ) {
          throw new Error()
        }
        connection1.send.mockClear()
        connection2.send.mockClear()
        connection3.send.mockClear()
        const connectionSubscriber1 = nameUndefinedConnectionSubscribers.get(
          options1.testConnectionId
        )
        const connectionSubscriber2 = nameUndefinedConnectionSubscribers.get(
          options1.testConnectionId
        )
        const connectionSubscriber3 = nameUndefinedConnectionSubscribers.get(
          options1.testConnectionId
        )
        if (
          undefined === connectionSubscriber1 ||
          undefined === connectionSubscriber2 ||
          undefined === connectionSubscriber3
        ) {
          throw new Error()
        }
        ;(connectionSubscriber1 as (message: any) => void)({
          type: 'DISPATCH',
          payload: { type: 'RESET' },
        })
        ;(connectionSubscriber2 as (message: any) => void)({
          type: 'DISPATCH',
          payload: { type: 'RESET' },
        })
        ;(connectionSubscriber3 as (message: any) => void)({
          type: 'DISPATCH',
          payload: { type: 'RESET' },
        })

        expect(api1.getState()).toStrictEqual(initialState1)
        expect(api1.getState()).toStrictEqual(initialState1)
        expect(api1.getState()).toStrictEqual(initialState1)
        expect(connection1.init).toHaveBeenLastCalledWith(initialState1)
        expect(connection2.init).toHaveBeenLastCalledWith(initialState2)
        expect(connection3.init).toHaveBeenLastCalledWith(initialState3)
        expect(connection1.send).not.toBeCalled()
        expect(connection2.send).not.toBeCalled()
        expect(connection3.send).not.toBeCalled()
      })

      it('COMMIT, it inits with current state, connections are isolated from each other', async () => {
        const { devtools } = await import('zustand/middleware')
        const create = await (await import('zustand/vanilla')).default
        const options1 = { testConnectionId: 'asdf' }
        const options2 = { testConnectionId: '2f' }
        const options3 = { testConnectionId: 'd2e' }
        const initialState1 = { count: 0 }
        const initialState2 = { count: 2 }
        const initialState3 = { count: 5 }
        const api1 = create(
          devtools(() => initialState1, { enabled: true, ...options1 })
        )
        const api2 = create(
          devtools(() => initialState2, { enabled: true, ...options2 })
        )
        const api3 = create(
          devtools(() => initialState3, { enabled: true, ...options3 })
        )
        api1.setState({ count: 1 })
        api2.setState({ count: 3 })
        api3.setState({ count: 10 })
        const currentState1 = api1.getState()
        const currentState2 = api2.getState()
        const currentState3 = api3.getState()

        const connection1 = nameUndefinedConnections.get(
          options1.testConnectionId
        )
        const connection2 = nameUndefinedConnections.get(
          options2.testConnectionId
        )
        const connection3 = nameUndefinedConnections.get(
          options3.testConnectionId
        )
        if (
          undefined === connection1 ||
          undefined === connection2 ||
          undefined === connection3
        ) {
          throw new Error()
        }
        connection1.send.mockClear()
        connection2.send.mockClear()
        connection3.send.mockClear()
        const connectionSubscriber1 = nameUndefinedConnectionSubscribers.get(
          options1.testConnectionId
        )
        const connectionSubscriber2 = nameUndefinedConnectionSubscribers.get(
          options2.testConnectionId
        )
        const connectionSubscriber3 = nameUndefinedConnectionSubscribers.get(
          options3.testConnectionId
        )
        if (
          undefined === connectionSubscriber1 ||
          undefined === connectionSubscriber2 ||
          undefined === connectionSubscriber3
        ) {
          throw new Error()
        }
        ;(connectionSubscriber1 as (message: any) => void)({
          type: 'DISPATCH',
          payload: { type: 'COMMIT' },
        })
        ;(connectionSubscriber2 as (message: any) => void)({
          type: 'DISPATCH',
          payload: { type: 'COMMIT' },
        })
        ;(connectionSubscriber3 as (message: any) => void)({
          type: 'DISPATCH',
          payload: { type: 'COMMIT' },
        })

        expect(connection1.init).toHaveBeenLastCalledWith(currentState1)
        expect(connection2.init).toHaveBeenLastCalledWith(currentState2)
        expect(connection3.init).toHaveBeenLastCalledWith(currentState3)
        expect(connection1.send).not.toBeCalled()
        expect(connection2.send).not.toBeCalled()
        expect(connection3.send).not.toBeCalled()
      })
    })

    describe('ROLLBACK...', () => {
      it('it updates state without recording and inits with `message.state, connections are isolated from each other`', async () => {
        const { devtools } = await import('zustand/middleware')
        const create = await (await import('zustand/vanilla')).default
        const options1 = { testConnectionId: 'asdf' }
        const options2 = { testConnectionId: '2f' }
        const options3 = { testConnectionId: 'd2e' }
        const initialState1 = { count: 0, increment: () => {} }
        const initialState2 = { count: 2, increment: () => {} }
        const initialState3 = { count: 5, increment: () => {} }
        const api1 = create(
          devtools(() => initialState1, { enabled: true, ...options1 })
        )
        const api2 = create(
          devtools(() => initialState2, { enabled: true, ...options2 })
        )
        const api3 = create(
          devtools(() => initialState3, { enabled: true, ...options3 })
        )
        const newState1 = { foo: 'bar1' }
        const newState2 = { foo: 'bar2' }
        const newState3 = { foo: 'bar3' }

        const connection1 = nameUndefinedConnections.get(
          options1.testConnectionId
        )
        const connection2 = nameUndefinedConnections.get(
          options2.testConnectionId
        )
        const connection3 = nameUndefinedConnections.get(
          options3.testConnectionId
        )
        if (
          undefined === connection1 ||
          undefined === connection2 ||
          undefined === connection3
        ) {
          throw new Error()
        }
        connection1.send.mockClear()
        connection2.send.mockClear()
        connection3.send.mockClear()
        const connectionSubscriber1 = nameUndefinedConnectionSubscribers.get(
          options1.testConnectionId
        )
        const connectionSubscriber2 = nameUndefinedConnectionSubscribers.get(
          options2.testConnectionId
        )
        const connectionSubscriber3 = nameUndefinedConnectionSubscribers.get(
          options3.testConnectionId
        )
        if (
          undefined === connectionSubscriber1 ||
          undefined === connectionSubscriber2 ||
          undefined === connectionSubscriber3
        ) {
          throw new Error()
        }
        ;(connectionSubscriber1 as (message: any) => void)({
          type: 'DISPATCH',
          payload: { type: 'ROLLBACK' },
          state: JSON.stringify(newState1),
        })
        ;(connectionSubscriber2 as (message: any) => void)({
          type: 'DISPATCH',
          payload: { type: 'ROLLBACK' },
          state: JSON.stringify(newState2),
        })
        ;(connectionSubscriber3 as (message: any) => void)({
          type: 'DISPATCH',
          payload: { type: 'ROLLBACK' },
          state: JSON.stringify(newState3),
        })

        expect(api1.getState()).toStrictEqual({
          ...initialState1,
          ...newState1,
        })
        expect(api2.getState()).toStrictEqual({
          ...initialState2,
          ...newState2,
        })
        expect(api3.getState()).toStrictEqual({
          ...initialState3,
          ...newState3,
        })
        expect(connection1.init).toHaveBeenLastCalledWith({
          ...initialState1,
          ...newState1,
        })
        expect(connection2.init).toHaveBeenLastCalledWith({
          ...initialState2,
          ...newState2,
        })
        expect(connection3.init).toHaveBeenLastCalledWith({
          ...initialState3,
          ...newState3,
        })
        expect(connection1.send).not.toBeCalled()
        expect(connection2.send).not.toBeCalled()
        expect(connection3.send).not.toBeCalled()
      })

      it('does not throw for unparsable `message.state`, connections are isolated from each other', async () => {
        const { devtools } = await import('zustand/middleware')
        const create = await (await import('zustand/vanilla')).default
        const increment1 = () => {}
        const increment2 = () => {}
        const increment3 = () => {}
        const options1 = { testConnectionId: 'asdf' }
        const options2 = { testConnectionId: '2f' }
        const options3 = { testConnectionId: 'd2e' }
        const initialState1 = { count: 0, increment: increment1 }
        const initialState2 = { count: 2, increment: increment2 }
        const initialState3 = { count: 5, increment: increment3 }
        const api1 = create(
          devtools(() => initialState1, { enabled: true, ...options1 })
        )
        const api2 = create(
          devtools(() => initialState2, { enabled: true, ...options2 })
        )
        const api3 = create(
          devtools(() => initialState3, { enabled: true, ...options3 })
        )
        const originalConsoleError = console.error
        console.error = jest.fn()

        const connection1 = nameUndefinedConnections.get(
          options1.testConnectionId
        )
        const connection2 = nameUndefinedConnections.get(
          options2.testConnectionId
        )
        const connection3 = nameUndefinedConnections.get(
          options3.testConnectionId
        )
        if (
          undefined === connection1 ||
          undefined === connection2 ||
          undefined === connection3
        ) {
          throw new Error()
        }
        connection1.init.mockClear()
        connection2.init.mockClear()
        connection3.init.mockClear()
        connection1.send.mockClear()
        connection2.send.mockClear()
        connection3.send.mockClear()
        const connectionSubscriber1 = nameUndefinedConnectionSubscribers.get(
          options1.testConnectionId
        )
        const connectionSubscriber2 = nameUndefinedConnectionSubscribers.get(
          options2.testConnectionId
        )
        const connectionSubscriber3 = nameUndefinedConnectionSubscribers.get(
          options3.testConnectionId
        )
        if (
          undefined === connectionSubscriber1 ||
          undefined === connectionSubscriber2 ||
          undefined === connectionSubscriber3
        ) {
          throw new Error()
        }
        ;(connectionSubscriber1 as (message: any) => void)({
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
        ;(connectionSubscriber2 as (message: any) => void)({
          type: 'DISPATCH',
          payload: { type: 'ROLLBACK' },
          state: 'foobar1',
        })
        expect(console.error).toHaveBeenLastCalledWith(
          '[zustand devtools middleware] Could not parse the received json',
          (() => {
            try {
              JSON.parse('foobar1')
            } catch (e) {
              return e
            }
          })()
        )
        ;(connectionSubscriber3 as (message: any) => void)({
          type: 'DISPATCH',
          payload: { type: 'ROLLBACK' },
          state: 'foobar3',
        })
        expect(console.error).toHaveBeenLastCalledWith(
          '[zustand devtools middleware] Could not parse the received json',
          (() => {
            try {
              JSON.parse('foobar3')
            } catch (e) {
              return e
            }
          })()
        )

        expect(api1.getState()).toBe(initialState1)
        expect(api2.getState()).toBe(initialState2)
        expect(api3.getState()).toBe(initialState3)
        expect(connection1.init).not.toBeCalled()
        expect(connection2.init).not.toBeCalled()
        expect(connection3.init).not.toBeCalled()
        expect(connection1.send).not.toBeCalled()
        expect(connection2.send).not.toBeCalled()
        expect(connection3.send).not.toBeCalled()

        console.error = originalConsoleError
      })
    })

    describe('JUMP_TO_STATE...', () => {
      const increment1 = () => {}
      const increment2 = () => {}
      const increment3 = () => {}

      it('it updates state without recording with `message.state`, connections are isolated from each other', async () => {
        const { devtools } = await import('zustand/middleware')
        const create = await (await import('zustand/vanilla')).default
        const options1 = { testConnectionId: 'asdf' }
        const options2 = { testConnectionId: '2f' }
        const options3 = { testConnectionId: 'd2e' }
        const initialState1 = { count: 0, increment: increment1 }
        const initialState2 = { count: 2, increment: increment2 }
        const initialState3 = { count: 5, increment: increment3 }
        const api1 = create(
          devtools(() => initialState1, { enabled: true, ...options1 })
        )
        const api2 = create(
          devtools(() => initialState2, { enabled: true, ...options2 })
        )
        const api3 = create(
          devtools(() => initialState3, { enabled: true, ...options3 })
        )
        const newState1 = { foo: 'bar1' }
        const newState2 = { foo: 'bar2' }
        const newState3 = { foo: 'bar3' }

        const connection1 = nameUndefinedConnections.get(
          options1.testConnectionId
        )
        const connection2 = nameUndefinedConnections.get(
          options2.testConnectionId
        )
        const connection3 = nameUndefinedConnections.get(
          options3.testConnectionId
        )
        if (
          undefined === connection1 ||
          undefined === connection2 ||
          undefined === connection3
        ) {
          throw new Error()
        }
        connection1.send.mockClear()
        connection2.send.mockClear()
        connection3.send.mockClear()
        const connectionSubscriber1 = nameUndefinedConnectionSubscribers.get(
          options1.testConnectionId
        )
        const connectionSubscriber2 = nameUndefinedConnectionSubscribers.get(
          options2.testConnectionId
        )
        const connectionSubscriber3 = nameUndefinedConnectionSubscribers.get(
          options3.testConnectionId
        )
        if (
          undefined === connectionSubscriber1 ||
          undefined === connectionSubscriber2 ||
          undefined === connectionSubscriber3
        ) {
          throw new Error()
        }
        ;(connectionSubscriber1 as (message: any) => void)({
          type: 'DISPATCH',
          payload: { type: 'JUMP_TO_STATE' },
          state: JSON.stringify(newState1),
        })
        ;(connectionSubscriber2 as (message: any) => void)({
          type: 'DISPATCH',
          payload: { type: 'JUMP_TO_STATE' },
          state: JSON.stringify(newState2),
        })
        ;(connectionSubscriber3 as (message: any) => void)({
          type: 'DISPATCH',
          payload: { type: 'JUMP_TO_STATE' },
          state: JSON.stringify(newState3),
        })

        expect(api1.getState()).toStrictEqual({
          ...initialState1,
          ...newState1,
        })
        expect(api2.getState()).toStrictEqual({
          ...initialState2,
          ...newState2,
        })
        expect(api3.getState()).toStrictEqual({
          ...initialState3,
          ...newState3,
        })
        expect(connection1.send).not.toBeCalled()
        expect(connection2.send).not.toBeCalled()
        expect(connection3.send).not.toBeCalled()
      })

      it('does not throw for unparsable `message.state`, connections are isolated from each other', async () => {
        const { devtools } = await import('zustand/middleware')
        const create = await (await import('zustand/vanilla')).default
        const options1 = { testConnectionId: 'asdf' }
        const options2 = { testConnectionId: '2f' }
        const options3 = { testConnectionId: 'd2e' }
        const initialState1 = { count: 0, increment: increment1 }
        const initialState2 = { count: 2, increment: increment2 }
        const initialState3 = { count: 5, increment: increment3 }
        const api1 = create(
          devtools(() => initialState1, { enabled: true, ...options1 })
        )
        const api2 = create(
          devtools(() => initialState2, { enabled: true, ...options2 })
        )
        const api3 = create(
          devtools(() => initialState3, { enabled: true, ...options3 })
        )
        const originalConsoleError = console.error
        console.error = jest.fn()

        const connection1 = nameUndefinedConnections.get(
          options1.testConnectionId
        )
        const connection2 = nameUndefinedConnections.get(
          options2.testConnectionId
        )
        const connection3 = nameUndefinedConnections.get(
          options3.testConnectionId
        )
        if (
          undefined === connection1 ||
          undefined === connection2 ||
          undefined === connection3
        ) {
          throw new Error()
        }
        connection1.send.mockClear()
        connection2.send.mockClear()
        connection3.send.mockClear()
        const connectionSubscriber1 = nameUndefinedConnectionSubscribers.get(
          options1.testConnectionId
        )
        const connectionSubscriber2 = nameUndefinedConnectionSubscribers.get(
          options2.testConnectionId
        )
        const connectionSubscriber3 = nameUndefinedConnectionSubscribers.get(
          options3.testConnectionId
        )
        if (
          undefined === connectionSubscriber1 ||
          undefined === connectionSubscriber2 ||
          undefined === connectionSubscriber3
        ) {
          throw new Error()
        }

        ;(connectionSubscriber1 as (message: any) => void)({
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
        ;(connectionSubscriber2 as (message: any) => void)({
          type: 'DISPATCH',
          payload: { type: 'JUMP_TO_STATE' },
          state: 'foobar2',
        })
        expect(console.error).toHaveBeenLastCalledWith(
          '[zustand devtools middleware] Could not parse the received json',
          (() => {
            try {
              JSON.parse('foobar2')
            } catch (e) {
              return e
            }
          })()
        )
        ;(connectionSubscriber3 as (message: any) => void)({
          type: 'DISPATCH',
          payload: { type: 'JUMP_TO_STATE' },
          state: 'foobar3',
        })
        expect(console.error).toHaveBeenLastCalledWith(
          '[zustand devtools middleware] Could not parse the received json',
          (() => {
            try {
              JSON.parse('foobar3')
            } catch (e) {
              return e
            }
          })()
        )

        expect(api1.getState()).toBe(initialState1)
        expect(api2.getState()).toBe(initialState2)
        expect(api3.getState()).toBe(initialState3)
        expect(connection1.send).not.toBeCalled()
        expect(connection2.send).not.toBeCalled()
        expect(connection3.send).not.toBeCalled()

        console.error = originalConsoleError
      })
    })

    describe('JUMP_TO_ACTION...', () => {
      const increment1 = () => {}
      const increment2 = () => {}
      const increment3 = () => {}

      it('it updates state without recording with `message.state`, connections are isolated from each other', async () => {
        const { devtools } = await import('zustand/middleware')
        const create = await (await import('zustand/vanilla')).default
        const options1 = { testConnectionId: 'asdf' }
        const options2 = { testConnectionId: '2f' }
        const options3 = { testConnectionId: 'd2e' }
        const initialState1 = { count: 0, increment: increment1 }
        const initialState2 = { count: 2, increment: increment2 }
        const initialState3 = { count: 5, increment: increment3 }
        const api1 = create(
          devtools(() => initialState1, { enabled: true, ...options1 })
        )
        const api2 = create(
          devtools(() => initialState2, { enabled: true, ...options2 })
        )
        const api3 = create(
          devtools(() => initialState3, { enabled: true, ...options3 })
        )
        const newState1 = { foo: 'bar1' }
        const newState2 = { foo: 'bar2' }
        const newState3 = { foo: 'bar3' }

        const connection1 = nameUndefinedConnections.get(
          options1.testConnectionId
        )
        const connection2 = nameUndefinedConnections.get(
          options2.testConnectionId
        )
        const connection3 = nameUndefinedConnections.get(
          options3.testConnectionId
        )
        if (
          undefined === connection1 ||
          undefined === connection2 ||
          undefined === connection3
        ) {
          throw new Error()
        }
        connection1.send.mockClear()
        connection2.send.mockClear()
        connection3.send.mockClear()
        const connectionSubscriber1 = nameUndefinedConnectionSubscribers.get(
          options1.testConnectionId
        )
        const connectionSubscriber2 = nameUndefinedConnectionSubscribers.get(
          options2.testConnectionId
        )
        const connectionSubscriber3 = nameUndefinedConnectionSubscribers.get(
          options3.testConnectionId
        )
        if (
          undefined === connectionSubscriber1 ||
          undefined === connectionSubscriber2 ||
          undefined === connectionSubscriber3
        ) {
          throw new Error()
        }

        ;(connectionSubscriber1 as (message: any) => void)({
          type: 'DISPATCH',
          payload: { type: 'JUMP_TO_ACTION' },
          state: JSON.stringify(newState1),
        })
        ;(connectionSubscriber2 as (message: any) => void)({
          type: 'DISPATCH',
          payload: { type: 'JUMP_TO_ACTION' },
          state: JSON.stringify(newState2),
        })
        ;(connectionSubscriber3 as (message: any) => void)({
          type: 'DISPATCH',
          payload: { type: 'JUMP_TO_ACTION' },
          state: JSON.stringify(newState3),
        })

        expect(api1.getState()).toStrictEqual({
          ...initialState1,
          ...newState1,
        })
        expect(api2.getState()).toStrictEqual({
          ...initialState2,
          ...newState2,
        })
        expect(api3.getState()).toStrictEqual({
          ...initialState3,
          ...newState3,
        })
        expect(connection1.send).not.toBeCalled()
        expect(connection2.send).not.toBeCalled()
        expect(connection3.send).not.toBeCalled()
      })

      it('does not throw for unparsable `message.state`, connections are isolated from each other', async () => {
        const { devtools } = await import('zustand/middleware')
        const create = await (await import('zustand/vanilla')).default
        const options1 = { testConnectionId: 'asdf' }
        const options2 = { testConnectionId: '2f' }
        const options3 = { testConnectionId: 'd2e' }
        const initialState1 = { count: 0, increment: increment1 }
        const initialState2 = { count: 2, increment: increment2 }
        const initialState3 = { count: 5, increment: increment3 }
        const api1 = create(
          devtools(() => initialState1, { enabled: true, ...options1 })
        )
        const api2 = create(
          devtools(() => initialState2, { enabled: true, ...options2 })
        )
        const api3 = create(
          devtools(() => initialState3, { enabled: true, ...options3 })
        )
        const originalConsoleError = console.error
        console.error = jest.fn()

        const connection1 = nameUndefinedConnections.get(
          options1.testConnectionId
        )
        const connection2 = nameUndefinedConnections.get(
          options2.testConnectionId
        )
        const connection3 = nameUndefinedConnections.get(
          options3.testConnectionId
        )
        if (
          undefined === connection1 ||
          undefined === connection2 ||
          undefined === connection3
        ) {
          throw new Error()
        }
        connection1.send.mockClear()
        connection2.send.mockClear()
        connection3.send.mockClear()
        const connectionSubscriber1 = nameUndefinedConnectionSubscribers.get(
          options1.testConnectionId
        )
        const connectionSubscriber2 = nameUndefinedConnectionSubscribers.get(
          options2.testConnectionId
        )
        const connectionSubscriber3 = nameUndefinedConnectionSubscribers.get(
          options3.testConnectionId
        )
        if (
          undefined === connectionSubscriber1 ||
          undefined === connectionSubscriber2 ||
          undefined === connectionSubscriber3
        ) {
          throw new Error()
        }
        ;(connectionSubscriber1 as (message: any) => void)({
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
        ;(connectionSubscriber2 as (message: any) => void)({
          type: 'DISPATCH',
          payload: { type: 'JUMP_TO_ACTION' },
          state: 'foobar2',
        })
        expect(console.error).toHaveBeenLastCalledWith(
          '[zustand devtools middleware] Could not parse the received json',
          (() => {
            try {
              JSON.parse('foobar2')
            } catch (e) {
              return e
            }
          })()
        )
        ;(connectionSubscriber3 as (message: any) => void)({
          type: 'DISPATCH',
          payload: { type: 'JUMP_TO_ACTION' },
          state: 'foobar3',
        })
        expect(console.error).toHaveBeenLastCalledWith(
          '[zustand devtools middleware] Could not parse the received json',
          (() => {
            try {
              JSON.parse('foobar3')
            } catch (e) {
              return e
            }
          })()
        )

        expect(api1.getState()).toBe(initialState1)
        expect(api2.getState()).toBe(initialState2)
        expect(api3.getState()).toBe(initialState3)
        expect(connection1.send).not.toBeCalled()
        expect(connection2.send).not.toBeCalled()
        expect(connection3.send).not.toBeCalled()

        console.error = originalConsoleError
      })

      it('IMPORT_STATE, it updates state without recording and inits the last computedState, connections are isolated from each other', async () => {
        const { devtools } = await import('zustand/middleware')
        const create = await (await import('zustand/vanilla')).default
        const options1 = { testConnectionId: 'asdf' }
        const options2 = { testConnectionId: '2f' }
        const options3 = { testConnectionId: 'd2e' }
        const initialState1 = { count: 0, increment: increment1 }
        const initialState2 = { count: 2, increment: increment2 }
        const initialState3 = { count: 5, increment: increment3 }
        const api1 = create(
          devtools(() => initialState1, { enabled: true, ...options1 })
        )
        const api2 = create(
          devtools(() => initialState2, { enabled: true, ...options2 })
        )
        const api3 = create(
          devtools(() => initialState3, { enabled: true, ...options3 })
        )
        const nextLiftedState1 = {
          computedStates: [{ state: { count: 4 } }, { state: { count: 5 } }],
        }
        const nextLiftedState2 = {
          computedStates: [{ state: { count: 20 } }, { state: { count: 8 } }],
        }
        const nextLiftedState3 = {
          computedStates: [{ state: { count: 12 } }, { state: { count: 100 } }],
        }

        const connection1 = nameUndefinedConnections.get(
          options1.testConnectionId
        )
        const connection2 = nameUndefinedConnections.get(
          options2.testConnectionId
        )
        const connection3 = nameUndefinedConnections.get(
          options3.testConnectionId
        )
        if (
          undefined === connection1 ||
          undefined === connection2 ||
          undefined === connection3
        ) {
          throw new Error()
        }
        connection1.send.mockClear()
        connection2.send.mockClear()
        connection3.send.mockClear()
        const connectionSubscriber1 = nameUndefinedConnectionSubscribers.get(
          options1.testConnectionId
        )
        const connectionSubscriber2 = nameUndefinedConnectionSubscribers.get(
          options2.testConnectionId
        )
        const connectionSubscriber3 = nameUndefinedConnectionSubscribers.get(
          options3.testConnectionId
        )
        if (
          undefined === connectionSubscriber1 ||
          undefined === connectionSubscriber2 ||
          undefined === connectionSubscriber3
        ) {
          throw new Error()
        }

        ;(connectionSubscriber1 as (message: any) => void)({
          type: 'DISPATCH',
          payload: {
            type: 'IMPORT_STATE',
            nextLiftedState: nextLiftedState1,
          },
        })
        ;(connectionSubscriber2 as (message: any) => void)({
          type: 'DISPATCH',
          payload: {
            type: 'IMPORT_STATE',
            nextLiftedState: nextLiftedState2,
          },
        })
        ;(connectionSubscriber3 as (message: any) => void)({
          type: 'DISPATCH',
          payload: {
            type: 'IMPORT_STATE',
            nextLiftedState: nextLiftedState3,
          },
        })

        expect(api1.getState()).toStrictEqual({
          ...initialState1,
          ...nextLiftedState1.computedStates.slice(-1)[0]?.state,
        })
        expect(api2.getState()).toStrictEqual({
          ...initialState2,
          ...nextLiftedState2.computedStates.slice(-1)[0]?.state,
        })
        expect(api3.getState()).toStrictEqual({
          ...initialState3,
          ...nextLiftedState3.computedStates.slice(-1)[0]?.state,
        })
        expect(connection1.send).toHaveBeenLastCalledWith(
          null,
          nextLiftedState1
        )
        expect(connection2.send).toHaveBeenLastCalledWith(
          null,
          nextLiftedState2
        )
        expect(connection3.send).toHaveBeenLastCalledWith(
          null,
          nextLiftedState3
        )
      })

      it('PAUSE_RECORDING, it toggles the sending of actions, connections are isolated from each other', async () => {
        const { devtools } = await import('zustand/middleware')
        const create = await (await import('zustand/vanilla')).default
        const options1 = { testConnectionId: 'asdf' }
        const options2 = { testConnectionId: '2f' }
        const options3 = { testConnectionId: 'd2e' }
        const api1 = create(
          devtools(() => ({ count: 0 }), { enabled: true, ...options1 })
        )
        const api2 = create(
          devtools(() => ({ count: 2 }), { enabled: true, ...options2 })
        )
        const api3 = create(
          devtools(() => ({ count: 4 }), { enabled: true, ...options3 })
        )

        const newState1 = { count: 1 }
        const newState2 = { count: 12 }
        const newState3 = { count: 30 }
        api1.setState(newState1, false, 'increment')
        api2.setState(newState2, false, 'increment')
        api3.setState(newState3, false, 'increment')

        const connection1 = nameUndefinedConnections.get(
          options1.testConnectionId
        )
        const connection2 = nameUndefinedConnections.get(
          options2.testConnectionId
        )
        const connection3 = nameUndefinedConnections.get(
          options3.testConnectionId
        )
        if (
          undefined === connection1 ||
          undefined === connection2 ||
          undefined === connection3
        ) {
          throw new Error()
        }
        const connectionSubscriber1 = nameUndefinedConnectionSubscribers.get(
          options1.testConnectionId
        )
        const connectionSubscriber2 = nameUndefinedConnectionSubscribers.get(
          options2.testConnectionId
        )
        const connectionSubscriber3 = nameUndefinedConnectionSubscribers.get(
          options3.testConnectionId
        )
        if (
          undefined === connectionSubscriber1 ||
          undefined === connectionSubscriber2 ||
          undefined === connectionSubscriber3
        ) {
          throw new Error()
        }

        expect(connection1.send).toHaveBeenLastCalledWith(
          { type: 'increment' },
          newState1
        )
        ;(connectionSubscriber1 as (message: any) => void)({
          type: 'DISPATCH',
          payload: { type: 'PAUSE_RECORDING' },
        })
        api1.setState({ count: 2 }, false, 'increment')
        expect(connection1.send).toHaveBeenLastCalledWith(
          { type: 'increment' },
          newState1
        )
        ;(connectionSubscriber1 as (message: any) => void)({
          type: 'DISPATCH',
          payload: { type: 'PAUSE_RECORDING' },
        })
        api1.setState({ count: 3 }, false, 'increment')
        expect(connection1.send).toHaveBeenLastCalledWith(
          { type: 'increment' },
          { count: 3 }
        )

        expect(connection2.send).toHaveBeenLastCalledWith(
          { type: 'increment' },
          newState2
        )
        ;(connectionSubscriber2 as (message: any) => void)({
          type: 'DISPATCH',
          payload: { type: 'PAUSE_RECORDING' },
        })
        api2.setState({ count: 2 }, false, 'increment')
        expect(connection2.send).toHaveBeenLastCalledWith(
          { type: 'increment' },
          newState2
        )
        ;(connectionSubscriber2 as (message: any) => void)({
          type: 'DISPATCH',
          payload: { type: 'PAUSE_RECORDING' },
        })
        api2.setState({ count: 3 }, false, 'increment')
        expect(connection2.send).toHaveBeenLastCalledWith(
          { type: 'increment' },
          { count: 3 }
        )

        expect(connection3.send).toHaveBeenLastCalledWith(
          { type: 'increment' },
          newState3
        )
        ;(connectionSubscriber3 as (message: any) => void)({
          type: 'DISPATCH',
          payload: { type: 'PAUSE_RECORDING' },
        })
        api3.setState({ count: 2 }, false, 'increment')
        expect(connection3.send).toHaveBeenLastCalledWith(
          { type: 'increment' },
          newState3
        )
        ;(connectionSubscriber3 as (message: any) => void)({
          type: 'DISPATCH',
          payload: { type: 'PAUSE_RECORDING' },
        })
        api3.setState({ count: 3 }, false, 'increment')
        expect(connection3.send).toHaveBeenLastCalledWith(
          { type: 'increment' },
          { count: 3 }
        )
      })
    })
  })
})

describe('when create devtools was called multiple times with `name` and `store` options defined', () => {
  describe('when `type` was provided in store state methods as option', () => {
    describe('When state changes...', () => {
      it("sends { type: setStateName || 'anonymous`, ...rest } as the action with current state", async () => {
        const { devtools } = await import('zustand/middleware')
        const create = await (await import('zustand/vanilla')).default
        const options = {
          name: 'testOptionsName',
          store: 'someStore',
          enabled: true,
        }
        const api = create(devtools(() => ({ count: 0, foo: 'bar' }), options))

        const testStateActionType = 'testSetStateName'

        api.setState({ count: 10 }, false, testStateActionType)
        const connection = connections.get(options.name)
        if (undefined === connection) {
          throw new Error()
        }
        expect(connection.send).toHaveBeenLastCalledWith(
          { type: `${options.store}/${testStateActionType}` },
          { [options.store]: { count: 10, foo: 'bar' } }
        )

        api.setState({ count: 15 }, false, {
          type: testStateActionType,
          payload: 15,
        })
        expect(connection.send).toHaveBeenLastCalledWith(
          { type: `${options.store}/${testStateActionType}`, payload: 15 },
          { [options.store]: { count: 15, foo: 'bar' } }
        )

        api.setState({ count: 5, foo: 'baz' }, true)
        expect(connection.send).toHaveBeenLastCalledWith(
          { type: `${options.store}/anonymous` },
          { [options.store]: { count: 5, foo: 'baz' } }
        )
      })
    })

    describe('when it receives a message of type...', () => {
      describe('ACTION...', () => {
        it('does nothing, connections isolated from each other', async () => {
          const { devtools } = await import('zustand/middleware')
          const create = await (await import('zustand/vanilla')).default
          const options1 = { testConnectionId: '123', store: 'store1' }
          const options2 = { testConnectionId: '231', store: 'store2' }
          const initialState1 = { count: 0 }
          const initialState2 = { count: 2 }
          const initialState3 = { count: 5 }
          const initialState4 = { count: 6 }
          const api1 = create(
            devtools(() => initialState1, {
              enabled: true,
              ...options1,
            })
          )
          const api2 = create(
            devtools(() => initialState2, {
              enabled: true,
              ...options1,
            })
          )
          const api3 = create(
            devtools(() => initialState3, {
              enabled: true,
              ...options2,
            })
          )
          const api4 = create(
            devtools(() => initialState4, {
              enabled: true,
              ...options2,
            })
          )
          const setState1 = jest.spyOn(api1, 'setState')
          const setState2 = jest.spyOn(api2, 'setState')
          const setState3 = jest.spyOn(api3, 'setState')
          const setState4 = jest.spyOn(api4, 'setState')

          const subscriber = nameUndefinedConnectionSubscribers.get(
            options1.testConnectionId
          )
          if (undefined === subscriber) {
            throw new Error()
          }
          ;(subscriber as (message: any) => void)({
            type: 'ACTION',
            payload: '{ "type": "INCREMENT" }',
          })

          expect(api1.getState()).toBe(initialState1)
          expect(api2.getState()).toBe(initialState2)
          expect(api3.getState()).toBe(initialState3)
          expect(api4.getState()).toBe(initialState4)
          expect(setState1).not.toBeCalled()
          expect(setState2).not.toBeCalled()
          expect(setState3).not.toBeCalled()
          expect(setState4).not.toBeCalled()
        })

        it('unless action type is __setState, connections isolated from each other', async () => {
          const { devtools } = await import('zustand/middleware')
          const create = await (await import('zustand/vanilla')).default
          const name1 = 'name1'
          const name2 = 'name2'
          const store1 = 'someStore1'
          const store2 = 'someStore2'
          const options1 = {
            name: name1,
            store: store1,
            testStore: store1,
          }
          const options2 = {
            name: name2,
            store: store2,
            testStore: store2,
          }
          const initialState1 = { count: 0 }
          const initialState2 = { count: 2 }
          const api1 = create(
            devtools(() => initialState1, { enabled: true, ...options1 })
          )
          const api2 = create(
            devtools(() => initialState2, { enabled: true, ...options2 })
          )
          const originalConsoleError = console.error
          console.error = jest.fn()

          const connectionSubscriber = connectionSubscribers.get(
            getKeyFromOptions(options1)
          )
          if (undefined === connectionSubscriber) {
            throw new Error()
          }
          ;(connectionSubscriber as (message: any) => void)({
            type: 'ACTION',
            payload:
              '{ "type": "__setState", "state": { "foo": "bar", "foo2": "bar2" } }',
          })

          expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining(
              '[zustand devtools middleware] Unsupported __setState'
            )
          )
          ;(connectionSubscriber as (message: any) => void)({
            type: 'ACTION',
            payload: `{ "type": "__setState", "state": { "${options1.store}": { "foo": "bar" } } }`,
          })

          expect(console.error).toHaveBeenCalledTimes(1)

          expect(api1.getState()).toStrictEqual({
            ...initialState1,
            foo: 'bar',
          })
          expect(api2.getState()).toStrictEqual({ ...initialState2 })

          console.error = originalConsoleError
        })

        it('does nothing even if there is `api.dispatch`, connections isolated from each other', async () => {
          const { devtools } = await import('zustand/middleware')
          const create = await (await import('zustand/vanilla')).default
          const name1 = 'name1'
          const name2 = 'name2'
          const store1 = 'someStore1'
          const store2 = 'someStore2'
          const options1 = {
            name: name1,
            store: store1,
            testStore: store1,
          }
          const options2 = {
            name: name2,
            store: store2,
            testStore: store2,
          }
          const initialState1 = { count: 0 }
          const initialState2 = { count: 2 }
          const api1 = create(
            devtools(() => initialState1, { enabled: true, ...options1 })
          )
          const api2 = create(
            devtools(() => initialState2, { enabled: true, ...options2 })
          )
          ;(api1 as any).dispatch = jest.fn()
          ;(api2 as any).dispatch = jest.fn()
          const setState1 = jest.spyOn(api1, 'setState')
          const setState2 = jest.spyOn(api2, 'setState')

          const connectionSubscriber1 = connectionSubscribers.get(
            getKeyFromOptions(options1)
          )
          const connectionSubscriber2 = connectionSubscribers.get(
            getKeyFromOptions(options2)
          )
          if (
            undefined === connectionSubscriber1 ||
            undefined === connectionSubscriber2
          ) {
            throw new Error()
          }
          const testPayload = {
            type: 'ACTION',
            payload: '{ "type": "INCREMENT" }',
          }
          ;(connectionSubscriber1 as (message: any) => void)(testPayload)
          ;(connectionSubscriber2 as (message: any) => void)(testPayload)

          expect(api1.getState()).toBe(initialState1)
          expect(api2.getState()).toBe(initialState2)
          expect(setState1).not.toBeCalled()
          expect(setState2).not.toBeCalled()
          expect((api1 as any).dispatch).not.toBeCalled()
          expect((api2 as any).dispatch).not.toBeCalled()
        })

        it('dispatches with `api.dispatch` when `api.dispatchFromDevtools` is set to true, connections are isolated from each other', async () => {
          const { devtools } = await import('zustand/middleware')
          const create = await (await import('zustand/vanilla')).default
          const name1 = 'name1'
          const name2 = 'name2'
          const store1 = 'someStore1'
          const store2 = 'someStore2'
          const options1 = {
            name: name1,
            store: store1,
            testStore: store1,
          }
          const options2 = {
            name: name2,
            store: store2,
            testStore: store2,
          }
          const initialState1 = { count: 0 }
          const initialState2 = { count: 2 }
          const api1 = create(
            devtools(() => initialState1, { enabled: true, ...options1 })
          )
          const api2 = create(
            devtools(() => initialState2, { enabled: true, ...options2 })
          )
          ;(api1 as any).dispatch = jest.fn()
          ;(api1 as any).dispatchFromDevtools = true
          ;(api2 as any).dispatch = jest.fn()
          ;(api2 as any).dispatchFromDevtools = true
          const setState1 = jest.spyOn(api1, 'setState')
          const setState2 = jest.spyOn(api2, 'setState')

          const connectionSubscriber1 = connectionSubscribers.get(
            getKeyFromOptions(options1)
          )
          const connectionSubscriber2 = connectionSubscribers.get(
            getKeyFromOptions(options2)
          )
          if (
            undefined === connectionSubscriber1 ||
            undefined === connectionSubscriber2
          ) {
            throw new Error()
          }
          const getTestPayload = (n: number) => ({
            type: 'ACTION',
            payload: `{ "type": "INCREMENT${n}" }`,
          })
          ;(connectionSubscriber1 as (message: any) => void)(getTestPayload(1))
          ;(connectionSubscriber2 as (message: any) => void)(getTestPayload(2))

          expect(api1.getState()).toBe(initialState1)
          expect(api2.getState()).toBe(initialState2)
          expect(setState1).not.toBeCalled()
          expect(setState2).not.toBeCalled()
          expect((api1 as any).dispatch).toHaveBeenLastCalledWith({
            type: 'INCREMENT1',
          })
          expect((api2 as any).dispatch).toHaveBeenLastCalledWith({
            type: 'INCREMENT2',
          })
        })
      })
    })
  })
})
