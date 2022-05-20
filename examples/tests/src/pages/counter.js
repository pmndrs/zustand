import { useCounter } from '../store/counter'

export const CounterPage = () => {
  const {count, increment, decrement} = useCounter()
  return <>
    <h1>{count}</h1>
    <button onClick={increment}>increment</button>
    <button onClick={decrement}>decrement</button>
  </>
}