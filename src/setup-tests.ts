import { act } from '@testing-library/react'
import type { State, StateCreator, StoreMutatorIdentifier } from './vanilla'
import actualCreate from './'

// maps use more memory than sets, but we can use them for
// easier memory management via disposing (edge case, but worth noting)
// not many people are going to destroy stores anyways, but what the heck
const pool = new Map<string, VoidFunction>()

// when creating a store, we get its initial state, create a reset function and add it in the set
const create = <
  T extends State,
  Mos extends [StoreMutatorIdentifier, unknown][] = []
>(
  createState: StateCreator<T, [], Mos>
) => {
  // make a random id for each of the stores
  const uid = Math.random().toString(36).substring(2, 12)
  // create the store
  const store = actualCreate(createState)
  // on destroy call the og destroy function
  // and remove it from the pool
  store.destroy = () => {
    store.destroy()
    pool.delete(uid)
  }
  // initial state for reset purposes
  const initialState = store.getState()
  // add the reset fn to the pool
  pool.set(uid, () => {
    store.setState(initialState)
  })
  return store
}

// Reset all stores after each test run
afterEach(() => {
  act(() => {
    pool.forEach((fn) => fn())
  })
})

jest.mock('./', () => create)
