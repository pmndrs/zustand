// import { useRef } from 'react'
// That doesnt work in ESM, because React libs are CJS only.
// The following is a workaround until ESM is supported.
import ReactExports from 'react'
import { shallow } from '../vanilla/shallow.ts'

const { useRef } = ReactExports

const sliceCache = new WeakMap<object, unknown>()

export function useShallow<S, U>(selector: (state: S) => U): (state: S) => U {
  const key = useRef({}).current
  return (state) => {
    const prev = sliceCache.get(key) as U | undefined
    const next = selector(state)
    if (shallow(prev, next)) {
      return prev as U
    }
    sliceCache.set(key, next)
    return next
  }
}
