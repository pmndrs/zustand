export * from './vanilla'
export { default as createStore } from './vanilla'
export * from './react'
export { default } from './react'

// For v3 compatibility
import { UseBoundStore } from './react'
import { State } from './vanilla'
/**
 * @deprecated rename to UseBoundStore
 */
export interface UseStore<T extends State> extends UseBoundStore<T> {}
