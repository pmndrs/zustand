import { act } from '@testing-library/react'
import type { State, StateCreator, StoreMutatorIdentifier } from './vanilla'
import actualCreate from './'

// a variable to hold reset functions for all stores declared in the app
const storeResetFns = new Set<VoidFunction>()

// when creating a store, we get its initial state, create a reset function and add it in the set
const create = <
  T extends State,
  Mos extends [StoreMutatorIdentifier, unknown][] = []
>(
  createState: StateCreator<T, [], Mos>
) => {
  const store = actualCreate(createState)
  const initialState = store.getState()
  storeResetFns.add(() => store.setState(initialState, true))
  return store
}

// Reset all stores after each test run
afterEach(() => {
  act(() => storeResetFns.forEach((resetFn) => resetFn()))
})

jest.mock('./', () => create)
