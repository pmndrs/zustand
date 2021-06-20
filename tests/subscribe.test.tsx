import create from '../src/index'

describe('subscribe()', () => {
  it('should not be called if new state identity is the same', () => {
    const spy = jest.fn()
    const initialState = { value: 1, other: 'a' }
    const { setState, subscribe } = create(() => initialState)

    subscribe(spy)
    setState(initialState)
    expect(spy).not.toHaveBeenCalled()
  })

  it('should be called if new state identity is different', () => {
    const spy = jest.fn()
    const initialState = { value: 1, other: 'a' }
    const { setState, getState, subscribe } = create(() => initialState)

    subscribe(spy)
    setState({ ...getState() })
    expect(spy).toHaveBeenCalledWith(initialState, initialState)
  })

  it('should not be called when state slice is the same', () => {
    const spy = jest.fn()
    const initialState = { value: 1, other: 'a' }
    const { setState, subscribe } = create(() => initialState)

    subscribe(spy, (s) => s.value)
    setState({ other: 'b' })
    expect(spy).not.toHaveBeenCalled()
  })

  it('should be called when state slice changes', () => {
    const spy = jest.fn()
    const initialState = { value: 1, other: 'a' }
    const { setState, subscribe } = create(() => initialState)

    subscribe(spy, (s) => s.value)
    setState({ value: initialState.value + 1 })
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(initialState.value + 1, initialState.value)
  })

  it('should not be called when equality checker returns true', () => {
    const spy = jest.fn()
    const initialState = { value: 1, other: 'a' }
    const { setState, subscribe } = create(() => initialState)

    subscribe(spy, undefined, () => true)
    setState({ value: initialState.value + 2 })
    expect(spy).not.toHaveBeenCalled()
  })

  it('should be called when equality checker returns false', () => {
    const spy = jest.fn()
    const initialState = { value: 1, other: 'a' }
    const { setState, subscribe } = create(() => initialState)

    subscribe(
      spy,
      (s) => s.value,
      () => false
    )
    setState({ value: initialState.value + 2 })
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(initialState.value + 2, initialState.value)
  })

  it('should unsubscribe correctly', () => {
    const spy = jest.fn()
    const initialState = { value: 1, other: 'a' }
    const { setState, subscribe } = create(() => initialState)

    const unsub = subscribe(spy, (s) => s.value)

    setState({ value: initialState.value + 1 })
    unsub()
    setState({ value: initialState.value + 2 })

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(initialState.value + 1, initialState.value)
  })

  it('should keep consistent behavior with equality check', () => {
    const spy = jest.fn()
    const initialState = { value: 1, other: 'a' }
    const { getState, setState, subscribe } = create(() => initialState)

    const isRoughEqual = (x: number, y: number) => Math.abs(x - y) < 1
    setState({ value: 0 })
    spy.mockReset()
    const spy2 = jest.fn()
    let prevValue = getState().value
    const unsub = subscribe((s) => {
      if (isRoughEqual(prevValue, s.value)) {
        // skip assuming values are equal
        return
      }
      spy(s.value, prevValue)
      prevValue = s.value
    })
    const unsub2 = subscribe(spy2, (s) => s.value, isRoughEqual)
    setState({ value: 0.5 })
    setState({ value: 1 })
    unsub()
    unsub2()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(1, 0)
    expect(spy2).toHaveBeenCalledTimes(1)
    expect(spy2).toHaveBeenCalledWith(1, 0)
  })
})
