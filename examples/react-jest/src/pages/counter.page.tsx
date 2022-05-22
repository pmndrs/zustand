import {useCounter} from "../store/counter.store";

export const CounterPage = () => {
  const {count, increment, decrement, reset} = useCounter()
  return <div data-testid={'counter-page'}>
    <h1 data-testid={'count'}>{count}</h1>
    <button onClick={increment}>+</button>
    <button onClick={decrement}>-</button>
    <button onClick={reset}>reset</button>
  </div>;
}