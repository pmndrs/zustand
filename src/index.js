import React from 'react'

export default function create(fn) {
  let state = {
    listeners: [],
    current: fn(
      merge => {
        if (typeof merge === 'function') merge = merge(state.current)
        state.current = Object.assign({}, state.current, merge)
        state.listeners.forEach(listener => listener(state.current))
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
      const sliceRef = React.useRef()
      React.useEffect(() => void (sliceRef.current = slice), [slice])
      React.useEffect(() => {
        const ping = () => {
          // Get fresh selected state
          let selected = selector ? selector(state.current) : state.current
          // If state is not equal from the get go and not an atomic then shallow equal it
          if (sliceRef.current !== selected && selected === Object(selected)) {
            selected = Object.entries(selected).reduce(
              (acc, [key, value]) =>
                sliceRef.current[key] !== value
                  ? Object.assign({}, acc, { [key]: value })
                  : acc,
              sliceRef.current
            )
          }
          // Refresh local slice, functional initial b/c selected itself could be a function
          if (sliceRef.current !== selected) set(() => selected)
        }
        state.listeners.push(ping)
        return () => (state.listeners = state.listeners.filter(i => i !== ping))
      }, dependencies || [selector])
      // Returning the selected state slice
      return selected
    },
    {
      subscribe: fn => {
        state.listeners.push(fn)
        return () => (state.listeners = state.listeners.filter(i => i !== fn))
      },
      getState: () => state.current,
      destroy: () => ((state.listeners = []), (state.current = {})),
    },
  ]
}
