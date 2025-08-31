import StoreProvider from '@/components/StoreProvider'
import CounterClient from '@/components/CounterClient'

export default function Page() {
  const initialState = { count: 42 }
  return (
    <StoreProvider initialState={initialState}>
      <h2>Next App Router × Zustand</h2>
      <p>Per-request vanilla store, client-only consumption (RSC safe)</p>
      <CounterClient />
    </StoreProvider>
  )
}