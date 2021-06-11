import create from '../src/index'

describe('subscribe()', () => {
  it('should not be called if new state identity is the same', () => {
    const initialState = { value: 1, other: 'a' }
    const { setState, subscribe } = create(() => initialState)

    subscribe(() => {
      throw new Error('subscriber called when new state identity is the same')
    })
    setState(initialState)
  })

  it('should be called if new state identity is different', () => {
    const initialState = { value: 1, other: 'a' }
    const { setState, getState, subscribe } = create(() => initialState)

    subscribe((newState: { value: number; other: string } | null) => {
      expect(newState && newState.value).toBe(1)
    })
    setState(initialState)
  })

  it('should not be called when state slice is the same', () => {
    const initialState = { value: 1, other: 'a' }
    const { setState, subscribe } = create(() => initialState)

    subscribe(
      () => {
        throw new Error('subscriber called when new state is the same')
      },
      (s) => s.value
    )
    setState({ other: 'b' })
  })

  it('should be called when state slice changes', () => {
    const initialState = { value: 1, other: 'a' }
    const { setState, subscribe } = create(() => initialState)
    const listener = jest.fn()

    subscribe(listener, (s) => s.value)
    setState({ value: initialState.value + 1 })
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(
      initialState.value + 1,
      initialState.value
    )
  })

  it('should not be called when equality checker returns true', () => {
    const initialState = { value: 1, other: 'a' }
    const { setState, subscribe } = create(() => initialState)

    subscribe(
      () => {
        throw new Error('subscriber called when equality checker returned true')
      },
      undefined,
      () => true
    )
    setState({ value: initialState.value + 2 })
  })

  it('should be called when equality checker returns false', () => {
    const initialState = { value: 1, other: 'a' }
    const { setState, subscribe } = create(() => initialState)
    const listener = jest.fn()

    subscribe(
      listener,
      (s) => s.value,
      () => false
    )
    setState({ value: initialState.value + 2 })
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(
      initialState.value + 2,
      initialState.value
    )
  })

  it('should unsubscribe correctly', () => {
    const initialState = { value: 1, other: 'a' }
    const { setState, subscribe } = create(() => initialState)
    const listener = jest.fn()

    const unsub = subscribe(listener, (s) => s.value)

    setState({ value: initialState.value + 1 })
    unsub()
    setState({ value: initialState.value + 2 })

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(
      initialState.value + 1,
      initialState.value
    )
  })

  it('should keep consistent behavior with equality check', () => {
    const initialState = { value: 1, other: 'a' }
    const { getState, setState, subscribe } = create(() => initialState)
    const listener = jest.fn()

    const isRoughEqual = (x: number, y: number) => Math.abs(x - y) < 1
    setState({ value: 0 })
    listener.mockReset()
    const listener2 = jest.fn()
    let prevValue = getState().value
    const unsub = subscribe((s) => {
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
})
