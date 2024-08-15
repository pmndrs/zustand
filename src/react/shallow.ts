// import { useRef } from 'react'
// That doesnt work in ESM, because React libs are CJS only.
// The following is a workaround until ESM is supported.
import ReactExports from 'react'
import { shallow } from '../vanilla/shallow.ts'

const { useRef } = ReactExports

export function useShallow<S, U>(selector: (state: S) => U): (state: S) => U {
  const prev = useRef<U>()

  return (state) => {
    const next = selector(state)
    return shallow(prev.current, next)
      ? (prev.current as U)
      : // It might not work with React Compiler
        // eslint-disable-next-line react-compiler/react-compiler
        (prev.current = next)
  }
}
