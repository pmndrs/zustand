import React from 'react'

export default function create(fn) {
  let listeners = []
  let state = {
    current: fn(
      merge => {
        if (typeof merge === 'function') {
          merge = merge(state.current)
        }
        state.current = { ...state.current, ...merge }
        listeners.forEach(listener => listener(state.current))
      },
      () => state.current
    ),
  }
  return [
    // useStore
    (selector, dependencies) => {
      let selected = selector ? selector(state.current) : state.current
      // Using functional initial b/c selected itself could be a function
      const [slice, set] = React.useState(() => selected)
      React.useEffect(() => {
        const ping = () => {
          // Get fresh selected state
          let selected = selector ? selector(state.current) : state.current
          // If state is not equal from the get go and not an atomic then shallow equal it
          if (slice !== selected && typeof selected === 'object' && !Array.isArray(selected)) {
            selected = Object.entries(selected).reduce(
              (acc, [key, value]) => (slice[key] !== value ? { ...acc, [key]: value } : acc),
              slice
            )
          }
          // Using functional initial b/c selected itself could be a function
          if (slice !== selected) {
            // Refresh local slice
            set(() => selected)
          }
        }
        listeners.push(ping)
        return () => (listeners = listeners.filter(i => i !== ping))
      }, dependencies || [selector])
      // Returning the selected state slice
      return selected
    },
    {
      subscribe: fn => {
        listeners.push(fn)
        return () => (listeners = listeners.filter(i => i !== fn))
      },
      getState: () => state.current,
      destroy: () => {
        listeners = []
        state.current = {}
      },
    },
  ]
}
