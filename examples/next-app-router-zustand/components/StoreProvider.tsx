'use client'
import React, { createContext, useContext, useRef } from 'react'
import type { StoreApi } from 'zustand'
import { createCounterStore, type CounterStore } from '@/lib/createStore'

const StoreContext = createContext<StoreApi<CounterStore> | null>(null)

export default function StoreProvider({ initialState, children }: { initialState?: Partial<CounterStore>, children: React.ReactNode }) {
  const storeRef = useRef<StoreApi<CounterStore>>()
  if (!storeRef.current) storeRef.current = createCounterStore(initialState)
  return <StoreContext.Provider value={storeRef.current}>{children}</StoreContext.Provider>
}

export function useCounterStore<T>(selector: (s: CounterStore) => T): T {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useCounterStore must be used within StoreProvider')
  const { useStore } = require('zustand')
  return useStore(store, selector)
}