import React, { useEffect } from 'react'
import { act, screen } from '@testing-library/react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { create } from 'zustand'

const IS_REACT_18 = React.version.startsWith('18')

describe('ssr behavior with react 18', () => {
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
      })
    )

    useEffect(() => {
      increasePopulation()
    }, [increasePopulation])

    return <div>bears: {bears}</div>
  }

  if (!IS_REACT_18) {
    it('Dummy test for React 17, ignore', () => {})
    return
  }

  it('should handle different states between server and client correctly', async () => {
    const markup = renderToString(
      <React.Suspense fallback={<div>Loading...</div>}>
        <Counter />
      </React.Suspense>
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
        </React.Suspense>
      )
    })

    const bearCountText = await screen.findByText('bears: 1')
    expect(bearCountText).not.toBeNull()
    document.body.removeChild(container)
  })
})
