import React, { useEffect } from 'react'
import { act, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { create } from 'zustand'

interface BearStoreState {
  bears: number
}

interface BearStoreAction {
  increasePopulation: () => void
}

const initialState = { bears: 0 }
const useBearStore = create<BearStoreState & BearStoreAction>((set) => ({
  ...initialState,
  increasePopulation: () => set(({ bears }) => ({ bears: bears + 1 })),
}))

function Counter() {
  const bears = useBearStore(({ bears }) => bears)
  const increasePopulation = useBearStore(
    ({ increasePopulation }) => increasePopulation,
  )

  useEffect(() => {
    increasePopulation()
  }, [increasePopulation])

  return <div>bears: {bears}</div>
}

describe.skipIf(!React.version.startsWith('18'))(
  'ssr behavior with react 18',
  () => {
    it('should handle different states between server and client correctly', async () => {
      const { hydrateRoot } =
        await vi.importActual<typeof import('react-dom/client')>(
          'react-dom/client',
        )

      const view = renderToString(
        <React.Suspense fallback={<div>Loading...</div>}>
          <Counter />
        </React.Suspense>,
      )

      const container = document.createElement('div')
      document.body.appendChild(container)
      container.innerHTML = view

      expect(container).toHaveTextContent(/bears: 0/)

      await act(async () => {
        hydrateRoot(
          container,
          <React.Suspense fallback={<div>Loading...</div>}>
            <Counter />
          </React.Suspense>,
        )
      })

      const bearCountText = await screen.findByText('bears: 1')
      expect(bearCountText).toBeInTheDocument()
      document.body.removeChild(container)
    })
    it('should not have hydration errors', async () => {
      const useStore = create(() => ({
        bears: 0,
      }))

      const { hydrateRoot } =
        await vi.importActual<typeof import('react-dom/client')>(
          'react-dom/client',
        )

      const Component = () => {
        const bears = useStore((state) => state.bears)
        return <div>bears: {bears}</div>
      }

      const view = renderToString(
        <React.Suspense fallback={<div>Loading...</div>}>
          <Component />
        </React.Suspense>,
      )

      const container = document.createElement('div')
      document.body.appendChild(container)
      container.innerHTML = view

      expect(container).toHaveTextContent(/bears: 0/)

      const consoleMock = vi.spyOn(console, 'error')

      const hydratePromise = act(async () => {
        hydrateRoot(
          container,
          <React.Suspense fallback={<div>Loading...</div>}>
            <Component />
          </React.Suspense>,
        )
      })

      // set state during hydration
      useStore.setState({ bears: 1 })

      await hydratePromise

      expect(consoleMock).toHaveBeenCalledTimes(0)

      const bearCountText = await screen.findByText('bears: 1')
      expect(bearCountText).toBeInTheDocument()
      document.body.removeChild(container)
    })
  },
)
