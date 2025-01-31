import type { StateCreator } from '../vanilla.ts'

/**
 * Configuration options for state synchronization
 * @template T - Type of the Zustand store state
 */
interface SyncStoreOptions<T> {
  /** Unique identifier for the synchronization channel */
  name: string
  /** Storage mechanism for fallback (default: localStorage) */
  storage?: Storage
  /** List of state fields to synchronize */
  fields: Array<keyof T>
}

/**
 * Zustand middleware for cross-tab state synchronization
 * @param options - Synchronization configuration
 * @returns Zustand middleware function
 */ export const syncStore = <T extends object>(
  options: SyncStoreOptions<T>,
) => {
  return (config: StateCreator<T>): StateCreator<T> =>
    (set, get, api) => {
      const { name, storage = localStorage, fields } = options
      let channel: BroadcastChannel | null = null

      // Initialize BroadcastChannel if supported
      try {
        channel = new BroadcastChannel(name)
     
      } catch (error:any) {
        console.warn(
          'BroadcastChannel not supported. Falling back to storage events.',
          
        )
      }

      // Filter state to include only specified fields
      const filterState = (state: T): Partial<T> => {
        return fields.reduce((acc, key) => {
          acc[key] = state[key]
          return acc
        }, {} as Partial<T>)
      }

      // Synchronization handler
      const syncState = (state: T) => {
        const filteredState = filterState(state)
        if (channel) {
          channel.postMessage(filteredState)
        } else {
          storage.setItem(name, JSON.stringify(filteredState))
        }
      }

      // Hydrate initial state from storage
      const storedState = storage.getItem(name)
      if (storedState) {
        try {
          set(JSON.parse(storedState))
        } catch (error) {
          console.error('Failed to parse stored state:', error)
        }
      }

      // Subscribe to state changes
      const unsubscribe = api.subscribe(syncState)

      // BroadcastChannel message handler
      let isSyncing = false
      if (channel) {
        channel.onmessage = (event: MessageEvent<Partial<T>>) => {
          if (isSyncing) return

          const currentState = get()
          const newState = event.data

          // Shallow comparison for performance
          const hasChanges = fields.some(
            (key) => !Object.is(currentState[key], newState[key]),
          )

          if (hasChanges) {
            isSyncing = true
            set(newState)
            isSyncing = false
          }
        }
      }

      // Storage event handler (fallback)
      const handleStorageEvent = (event: StorageEvent) => {
        if (event.key === name && event.newValue) {
          try {
            set(JSON.parse(event.newValue))
          } catch (error) {
            console.error('Failed to parse storage state:', error)
          }
        }
      }

      window.addEventListener('storage', handleStorageEvent)

      // Return enhanced store with cleanup
      return {
        ...config(set, get, api),
        $sync: {
          destroy: () => {
            unsubscribe()
            channel?.close()
            window.removeEventListener('storage', handleStorageEvent)
          },
        },
      }
    }
}
