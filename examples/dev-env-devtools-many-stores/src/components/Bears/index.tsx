import { useBearsStore } from './bear-store'
import React from 'react'

export const Bears = () => {
  const bears = useBearsStore((state) => state.bears)
  const arr = []
  for (let i = 0; i < bears; i += 1) {
    arr.push(<span key={i}>🐻</span>)
  }
  return <div>{arr}</div>
}
