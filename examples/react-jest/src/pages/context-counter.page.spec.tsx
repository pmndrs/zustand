// pages/context-counter.page.spec.tsx
import {
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { ContextCounter } from './context-counter.page';
import { useContextCounter } from '../store/context-counter.store';

// exactly the same, just the hook's name is different
jest.mock('../store/context-counter.store', () => ({
  useContextCounter: jest.fn(),
}));

const mockedCounter =
  useContextCounter as unknown as jest.MockedFn<
    typeof useContextCounter
    >;

describe('ContextCounterPage', () => {
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
    render(<ContextCounter />);
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
    render(<ContextCounter />);
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

    render(<ContextCounter />);

    // get all the buttons
    const incrementButton =
      screen.getByText('+');
    const decrementButton =
      screen.getByText('-');
    const resetButton =
      screen.getByText('reset');
    // fire the events and check if they've been called
    fireEvent.click(incrementButton);
    expect(
      increment
    ).toHaveBeenCalledTimes(1);
    fireEvent.click(decrementButton);
    expect(
      decrement
    ).toHaveBeenCalledTimes(1);
    fireEvent.click(resetButton);
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