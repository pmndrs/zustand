import { act } from '@testing-library/react'
import type { State, StateCreator, StoreMutatorIdentifier } from 'zustand'
import actualCreate from 'zustand'

// A pool of reset functions
const pool = new Set<VoidFunction>()

// when creating a store, we get its initial state, create a reset function and add it in the set
const create = <
  T extends State,
  Mos extends [StoreMutatorIdentifier, unknown][] = []
>(
  createState: StateCreator<T, [], Mos>
) => {
  // create the store
  const store = actualCreate(createState)

  // initial state for reset purposes
  const initialState = store.getState()

  // reset the store back to it's initial state
  const resetStore = () => {
    store.setState(initialState)
  }

  // destroy the store and delete it from the pool
  const destroy = () => {
    store.destroy()
    pool.delete(resetStore)
  }

  // add the reset fn to the pool
  pool.add(resetStore)

  // on destroy call the og destroy function
  // and remove it from the pool
  store.destroy = destroy

  return store
}

// Reset all stores after each test run
afterEach(() => {
  act(() => {
    for (const fn of pool) {
      fn()
    }
  })
})

// eslint-disable-next-line no-restricted-syntax
export default create
