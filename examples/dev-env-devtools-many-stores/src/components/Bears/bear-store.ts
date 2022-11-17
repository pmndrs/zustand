import { devOnlyDevtools as devtools } from '@pavlobu/zustand/middleware'
import { immer } from '@pavlobu/zustand/middleware/immer'
import { reactDevtoolsConnectionName } from '../../utils/redux-devtools/constants'
import create from '@pavlobu/zustand'

export interface BearsState {
  bears: number
  increasePopulation: () => void
  removeBear: () => void
  removeAllBears: () => void
  setSpecificBearsAmount: (n: number) => void
}

export const useBearsStore = create<BearsState>()(
  devtools(
    immer((set) => ({
      bears: 0,
      increasePopulation: () =>
        set(
          (store) => {
            store.bears += 1
          },
          false,
          { type: 'increasePopulation' }
        ),
      removeBear: () =>
        set(
          (state) => {
            state.bears -= 1
          },
          false,
          { type: 'removeBear' }
        ),
      removeAllBears: () =>
        set(
          (state) => {
            state.bears = 0
          },
          false,
          { type: 'removeAllBears' }
        ),
      setSpecificBearsAmount: (amount: number) =>
        set(
          (state) => {
            state.bears = amount
          },
          false,
          { type: 'setSpecificBearsAmount' }
        ),
    })),
    { name: reactDevtoolsConnectionName, store: 'app/bears' }
  )
)
