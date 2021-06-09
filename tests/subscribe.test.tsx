import create from '../src/index'

it('can subscribe to the store', () => {
  const initialState = { value: 1, other: 'a' }
  const { setState, getState, subscribe } = create(() => initialState)
  const listener = jest.fn()

  // Should not be called if new state identity is the same
  let unsub = subscribe(() => {
    throw new Error('subscriber called when new state identity is the same')
  })
  setState(initialState)
  unsub()

  // Should be called if new state identity is different
  unsub = subscribe((newState: { value: number; other: string } | null) => {
    expect(newState && newState.value).toBe(1)
  })
  setState({ ...getState() })
  unsub()

  // Should not be called when state slice is the same
  unsub = subscribe(
    () => {
      throw new Error('subscriber called when new state is the same')
    },
    (s) => s.value
  )
  setState({ other: 'b' })
  unsub()

  // Should be called when state slice changes
  listener.mockReset()
  unsub = subscribe(listener, (s) => s.value)
  setState({ value: initialState.value + 1 })
  unsub()
  expect(listener).toHaveBeenCalledTimes(1)
  expect(listener).toHaveBeenCalledWith(
    initialState.value + 1,
    initialState.value
  )

  // Should not be called when equality checker returns true
  unsub = subscribe(
    () => {
      throw new Error('subscriber called when equality checker returned true')
    },
    undefined,
    () => true
  )
  setState({ value: initialState.value + 2 })
  unsub()

  // Should be called when equality checker returns false
  listener.mockReset()
  unsub = subscribe(
    listener,
    (s) => s.value,
    () => false
  )
  setState({ value: initialState.value + 2 })
  unsub()
  expect(listener).toHaveBeenCalledTimes(1)
  expect(listener).toHaveBeenCalledWith(
    initialState.value + 2,
    initialState.value + 2
  )

  // Should keep consistent behavior with equality check
  const isRoughEqual = (x: number, y: number) => Math.abs(x - y) < 1
  setState({ value: 0 })
  listener.mockReset()
  const listener2 = jest.fn()
  let prevValue = getState().value
  unsub = subscribe((s) => {
    if (isRoughEqual(prevValue, s.value)) {
      // skip assuming values are equal
      return
    }
    listener(s.value, prevValue)
    prevValue = s.value
  })
  const unsub2 = subscribe(listener2, (s) => s.value, isRoughEqual)
  setState({ value: 0.5 })
  setState({ value: 1 })
  unsub()
  unsub2()
  expect(listener).toHaveBeenCalledTimes(1)
  expect(listener).toHaveBeenCalledWith(1, 0)
  expect(listener2).toHaveBeenCalledTimes(1)
  expect(listener2).toHaveBeenCalledWith(1, 0)
})
