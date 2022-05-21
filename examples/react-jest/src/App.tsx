import React from 'react';
import { CounterPage } from './pages/counter.page'
import { ContextCounterPage } from './pages/context-counter.page'

function App() {
  return (
    <div className="App">
      <CounterPage />
      <CounterPage />
      <h3>These are all scoped counters, not global</h3>
      <ContextCounterPage />
    </div>
  );
}

export default App;
