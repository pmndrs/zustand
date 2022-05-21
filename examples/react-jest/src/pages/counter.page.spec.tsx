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
jest.mock('../store/counter.store', () => ({
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