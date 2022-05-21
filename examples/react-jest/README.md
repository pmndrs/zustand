# Testing Zustand

## Pre-requisites

There are a couple of pre-requisites to testing Zustand in order to have the best experience while doing so.
First you need to mock the `create` function in order to reset the store after each tests,
which will give you a pure testing enviroment.

```ts
// This code lives in: src(?)/__mocks__/zustand/index.ts
import actualCreate from 'zustand';
import type {
  StateCreator,
  State,
  StoreMutatorIdentifier,
} from 'zustand/vanilla';
import { act } from 'react-dom/test-utils';

// a variable to hold reset functions for all stores declared in the app
const storeResetFns =
  new Set<VoidFunction>();

// when creating a store, we get its initial state, create a reset function and add it in the set
const create = <
  T extends State,
  Mos extends [
    StoreMutatorIdentifier,
    unknown
  ][] = []
>(
  createState: StateCreator<T, [], Mos>
) => {
  const store = actualCreate(
    createState
  );
  const initialState = store.getState();
  storeResetFns.add(() =>
    store.setState(initialState, true)
  );
  return store;
};

// Reset all stores after each test run
afterEach(() => {
  act(() =>
    storeResetFns.forEach(resetFn =>
      resetFn()
    )
  );
});

export default create;
```

The way you can mock a dependency depends on your test runner.

In jest, you can create a `__mocks__/zustand.ts` and place the code there. If your app is using zustand/vanilla instead
of zustand, then you'll have to place the above code in `__mocks__/zustand/vanilla.ts`

If you use JavaScript, instead of TypeScript change the extensions to `.js` and remove the type definitions.

## Best practices

As with everything in life there are good and better ways to doing this.
This applies to testing your stateful app as wel.

Some of the stuff we realized that works best is the following setup:

- Test your store in isolation.
- Mock the store within your components and make sure it does what you expect.
- Don't test implementation, rather test the expected behaviour.

## Examples

The best way of showing you what we mean is via examples
and the best example is a counter app.
This counter app will show the count, increment, decrement and reset the count on a button press.

The code looks something like this:

```ts
// store/counter.store.ts

import create from 'zustand';

type Store = {
  count: number;
  increment: VoidFunction;
  decrement: VoidFunction;
  reset: VoidFunction;
};

export const useCounter = create<Store>(
  set => ({
    count: 0,
    increment() {
      set(({ count }) => ({
        count: count + 1,
      }));
    },
    decrement() {
      set(({ count }) => ({
        count: count - 1,
      }));
    },
    reset() {
      set({ count: 0 });
    },
  })
);
```

```tsx
// pages/counter.page.tsx

import { useCounter } from '../store/counter.store';

export const CounterPage = () => {
  const {
    count,
    increment,
    decrement,
    reset,
  } = useCounter();
  return (
    <div data-testid={'counter-page'}>
      <h1 data-testid={'count'}>
        {count}
      </h1>
      <button onClick={increment}>
        +
      </button>
      <button onClick={decrement}>
        -
      </button>
      <button onClick={reset}>
        reset
      </button>
    </div>
  );
};
```

Pretty simple app, but in order to test expected behaviour we need to isolate the two intersected parts and test them
separately.
This is what we meant when we said test everything in isolation.

Let's test our store first. Our acceptance criteria for the store is it needs to hold
a count and it needs to increment, decrement and reset said count.

Pretty simple tests, this is how they'd look like:

```ts
// store/counter.spec.ts
import {
  act,
  renderHook,
} from '@testing-library/react';
import { useCounter } from './counter.store';

describe('Counter Store', () => {
  // pretty self explanatory
  it('should have an initial value of 0', () => {
    const { result } = renderHook(() =>
      useCounter()
    );
    expect(result.current.count).toBe(
      0
    );
  });

  // for x incrementations, it should be x
  it('should increment the value', () => {
    const { result } = renderHook(() =>
      useCounter()
    );
    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.increment();
      result.current.increment();
    });
    expect(result.current.count).toBe(
      4
    );
  });

  // for x decrementations, it should be -x
  it('should decrement the value', () => {
    // because we mocked our store in the pre-requisites
    // we can safely assume that it's been reinitialized
    // back to it's initial state after each test
    const { result } = renderHook(() =>
      useCounter()
    );
    act(() => {
      result.current.decrement();
      result.current.decrement();
      result.current.decrement();
      result.current.decrement();
    });
    expect(result.current.count).toBe(
      -4
    );
  });

  // no matter how much we increment or decrement,
  // it should reset to 0
  it('should reset the value', () => {
    const { result } = renderHook(() =>
      useCounter()
    );
    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.increment();
    });
    expect(result.current.count).toBe(
      3
    );
    act(() => {
      result.current.reset();
    });
    expect(result.current.count).toBe(
      0
    );
  });
});
```

Now, this is where the fun begins.

```tsx
// pages/counter.page.spec.tsx
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { CounterPage } from './counter.page';
import { useCounter } from '../store/counter.store';

// let's mock the whole counter, so we don't worry about it
jest.mock('../store/counter', () => ({
  useCounter: jest.fn(),
}));

// make sure we add types to it since we
// don't do type unsafety around these parts
const mockedCounter =
  useCounter as unknown as jest.MockedFn<
    typeof useCounter
  >;

describe('CounterPage', () => {
  // we make sure to clean up the dom tree after
  // each test
  afterEach(cleanup);
  it('should render', () => {
    // before each test we mock the useCounter hook
    // because we don't care about it's functionality
    // we only care about the page's behaviour in regards to the store's actions
    // we can safely do this because we already tested it separately
    mockedCounter.mockImplementationOnce(
      () => {
        return {
          count: 0,
          increment: jest.fn(),
          decrement: jest.fn(),
          reset: jest.fn(),
        };
      }
    );
    render(<CounterPage />);
    expect(
      screen.getByTestId('counter-page')
    ).toBeTruthy();
  });

  // simple smoke test, nothing special
  it('should render initial count', () => {
    mockedCounter.mockImplementationOnce(
      () => {
        return {
          count: 0,
          increment: jest.fn(),
          decrement: jest.fn(),
          reset: jest.fn(),
        };
      }
    );
    render(<CounterPage />);
    expect(
      screen.getByTestId('count')
    ).toHaveTextContent('0');
  });

  // this is where the fun begins
  it('should call the functions on button press', () => {
    // lets mock all these functions so we can test
    // if they get called.
    // This is the expected behaviour of this page.
    const increment = jest.fn();
    const decrement = jest.fn();
    const reset = jest.fn();
    mockedCounter.mockImplementationOnce(
      () => {
        return {
          count: 0,
          increment,
          decrement,
          reset,
        };
      }
    );

    render(<CounterPage />);

    // get all the buttons
    const incrementButton =
      screen.getByText('+');
    const decrementButton =
      screen.getByText('-');
    const resetButton =
      screen.getByText('reset');
    // fire the events and check if they've been called
    act(() => {
      fireEvent.click(incrementButton);
    });
    expect(
      increment
    ).toHaveBeenCalledTimes(1);
    act(() => {
      fireEvent.click(decrementButton);
    });
    expect(
      decrement
    ).toHaveBeenCalledTimes(1);
    act(() => {
      fireEvent.click(resetButton);
    });
    expect(reset).toHaveBeenCalledTimes(
      1
    );

    // notice how we don't test if the count is good?
    // this is because we don't care about the count
    // we let the store tests figure that out, because we
    // don't care about the store's behaviour here
    // we only care about the page's behaviour in regards to the store's actions
  });
});
```

## Epiloque

As with all test, we need to make sure that we test behaviour separately and our concerns are properly managed.
If something is interacting with the store, we have to make sure that we test it's behaviour and not it's
implementation.
Don't care about the store when you're testing pages or components, it's not the concern of the test.
The test's concern should be if something was invoked and with the right arguments, not the output and/or manipulation
of the store.
If you can't test it like this, maybe your code is very tightly coupled and you need to rethink a
lot of the architecture and data flow so that you can properly test and maintain your codebase.
