import { useContextCounter, CounterProvider, createCounter } from '../store/context-counter.store'

export const ContextCounter = () => {
  const { count, increment, decrement, reset } = useContextCounter()

  return <div data-testid={'counter-page'}>
    <h1 data-testid={'count'}>{count}</h1>
    <button onClick={increment}>+</button>
    <button onClick={decrement}>-</button>
    <button onClick={reset}>reset</button>
  </div>;
}
export const ContextCounterPage = () => {
  return <>
    <div>
      <CounterProvider createStore={createCounter}>
        <ContextCounter />
      </CounterProvider>
    </div>
    <div>
      <CounterProvider createStore={createCounter}>
        <ContextCounter />
      </CounterProvider>
    </div>
    <div>
      <CounterProvider createStore={createCounter}>
        <ContextCounter />
      </CounterProvider>
    </div>
  </>
}