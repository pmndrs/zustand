import { useState, useEffect } from 'react'

export default function create(fn) {
  let listeners = []
  let state = {
    current: fn(
      merge => {
        if (typeof merge === 'function') {
          merge = merge(state.current)
        }
        state.current = { ...state.current, ...merge }
        listeners.forEach(listener => listener())
      },
      () => state.current
    ),
  }
  return (selector, dependencies) => {
    const selected = selector(state.current)
    // Using functional initial b/c selected itself could be a function
    const [slice, set] = useState(() => selected)
    useEffect(() => {
      const ping = () => {
        // Get fresh selected state
        let selected = selector(state.current)
        // If state is not a atomic shallow equal it
        if (typeof selected === 'object' && !Array.isArray(selected)) {
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
  }
}
