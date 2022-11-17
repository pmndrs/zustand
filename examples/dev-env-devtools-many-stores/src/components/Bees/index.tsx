import { useBeesStore } from './bees-store'
import React from 'react'

export const Bees = () => {
  const bees = useBeesStore((state) => state.bees)
  const arr = []
  for (let i = 0; i < bees; i += 1) {
    arr.push(<span key={i}>🐝</span>)
  }
  return <div>{arr}</div>
}
