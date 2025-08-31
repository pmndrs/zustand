'use client'
import { useCounterStore } from '@/components/StoreProvider'

export default function CounterClient() {
  const count = useCounterStore(s => s.count)
  const inc = useCounterStore(s => s.inc)
  const dec = useCounterStore(s => s.dec)
  const reset = useCounterStore(s => s.reset)

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ fontSize: 18 }}>count: {count}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={inc}>+1</button>
        <button onClick={dec}>-1</button>
        <button onClick={reset}>reset</button>
      </div>
    </div>
  )
}