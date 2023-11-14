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
  const { bears, increasePopulation } = useBearStore(
    ({ bears, increasePopulation }) => ({
      bears,
      increasePopulation,
    }),
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

      const markup = renderToString(
        <React.Suspense fallback={<div>Loading...</div>}>
          <Counter />
        </React.Suspense>,
      )

      const container = document.createElement('div')
      document.body.appendChild(container)
      container.innerHTML = markup

      expect(container.textContent).toContain('bears: 0')

      await act(async () => {
        hydrateRoot(
          container,
          <React.Suspense fallback={<div>Loading...</div>}>
            <Counter />
          </React.Suspense>,
        )
      })

      const bearCountText = await screen.findByText('bears: 1')
      expect(bearCountText).not.toBeNull()
      document.body.removeChild(container)
    })
  },
)
