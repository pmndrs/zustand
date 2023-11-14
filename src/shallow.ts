import { shallow } from './vanilla/shallow.ts'

// We will export this in v5 and remove default export
// export { shallow } from './vanilla/shallow.ts'
// export { useShallow } from './react/shallow.ts'

/**
 * @deprecated Use `import { shallow } from 'zustand/shallow'`
 */
export default ((objA, objB) => {
  if (import.meta.env?.MODE !== 'production') {
    console.warn(
      "[DEPRECATED] Default export is deprecated. Instead use `import { shallow } from 'zustand/shallow'`.",
    )
  }
  return shallow(objA, objB)
}) as typeof shallow

export { shallow }
