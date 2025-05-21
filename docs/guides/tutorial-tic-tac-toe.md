---
title: 'Tutorial: Tic-Tac-Toe'
description: Building a game
nav: 0
---

# Tutorial: Tic-Tac-Toe

## Building a game

You will build a small tic-tac-toe game during this tutorial. This tutorial does assume existing
React knowledge. The techniques you'll learn in the tutorial are fundamental to building any React
app, and fully understanding it will give you a deep understanding of React and Zustand.

> [!NOTE]
> This tutorial is crafted for those who learn best through hands-on experience and want to swiftly
> create something tangible. It draws inspiration from React's tic-tac-toe tutorial.

The tutorial is divided into several sections:

- Setup for the tutorial will give you a starting point to follow the tutorial.
- Overview will teach you the fundamentals of React: components, props, and state.
- Completing the game will teach you the most common techniques in React development.
- Adding time travel will give you a deeper insight into the unique strengths of React.

### What are you building?

In this tutorial, you'll build an interactive tic-tac-toe game with React and Zustand.

You can see what it will look like when you're finished here:

```jsx
import { create } from 'zustand'
import { combine } from 'zustand/middleware'

const useGameStore = create(
  combine(
    {
      history: [Array(9).fill(null)],
      currentMove: 0,
    },
    (set, get) => {
      return {
        setHistory: (nextHistory) => {
          set((state) => ({
            history:
              typeof nextHistory === 'function'
                ? nextHistory(state.history)
                : nextHistory,
          }))
        },
        setCurrentMove: (nextCurrentMove) => {
          set((state) => ({
            currentMove:
              typeof nextCurrentMove === 'function'
                ? nextCurrentMove(state.currentMove)
                : nextCurrentMove,
          }))
        },
      }
    },
  ),
)

function Square({ value, onSquareClick }) {
  return (
    <button
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        backgroundColor: '#fff',
        border: '1px solid #999',
        outline: 0,
        borderRadius: 0,
        fontSize: '1rem',
        fontWeight: 'bold',
      }}
      onClick={onSquareClick}
    >
      {value}
    </button>
  )
}

function Board({ xIsNext, squares, onPlay }) {
  const winner = calculateWinner(squares)
  const turns = calculateTurns(squares)
  const player = xIsNext ? 'X' : 'O'
  const status = calculateStatus(winner, turns, player)

  function handleClick(i) {
    if (squares[i] || winner) return
    const nextSquares = squares.slice()
    nextSquares[i] = player
    onPlay(nextSquares)
  }

  return (
    <>
      <div style={{ marginBottom: '0.5rem' }}>{status}</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          width: 'calc(3 * 2.5rem)',
          height: 'calc(3 * 2.5rem)',
          border: '1px solid #999',
        }}
      >
        {squares.map((_, i) => (
          <Square
            key={`square-${i}`}
            value={squares[i]}
            onSquareClick={() => handleClick(i)}
          />
        ))}
      </div>
    </>
  )
}

export default function Game() {
  const history = useGameStore((state) => state.history)
  const setHistory = useGameStore((state) => state.setHistory)
  const currentMove = useGameStore((state) => state.currentMove)
  const setCurrentMove = useGameStore((state) => state.setCurrentMove)
  const xIsNext = currentMove % 2 === 0
  const currentSquares = history[currentMove]

  function handlePlay(nextSquares) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares]
    setHistory(nextHistory)
    setCurrentMove(nextHistory.length - 1)
  }

  function jumpTo(nextMove) {
    setCurrentMove(nextMove)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        fontFamily: 'monospace',
      }}
    >
      <div>
        <Board xIsNext={xIsNext} squares={currentSquares} onPlay={handlePlay} />
      </div>
      <div style={{ marginLeft: '1rem' }}>
        <ol>
          {history.map((_, historyIndex) => {
            const description =
              historyIndex > 0
                ? `Go to move #${historyIndex}`
                : 'Go to game start'

            return (
              <li key={historyIndex}>
                <button onClick={() => jumpTo(historyIndex)}>
                  {description}
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ]

  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i]
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a]
    }
  }

  return null
}

function calculateTurns(squares) {
  return squares.filter((square) => !square).length
}

function calculateStatus(winner, turns, player) {
  if (!winner && !turns) return 'Draw'
  if (winner) return `Winner ${winner}`
  return `Next player: ${player}`
}
```

### Building the board

Let's start by creating the `Square` component, which will be a building block for our `Board`
component. This component will represent each square in our game.

The `Square` component should take `value` and `onSquareClick` as props. It should return a
`<button>` element, styled to look like a square. The button displays the value prop, which can be
`'X'`, `'O'`, or `null`, depending on the game's state. When the button is clicked, it triggers the
`onSquareClick` function passed in as a prop, allowing the game to respond to user input.

Here's the code for the `Square` component:

```jsx
function Square({ value, onSquareClick }) {
  return (
    <button
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        backgroundColor: '#fff',
        border: '1px solid #999',
        outline: 0,
        borderRadius: 0,
        fontSize: '1rem',
        fontWeight: 'bold',
      }}
      onClick={onSquareClick}
    >
      {value}
    </button>
  )
}
```

Let's move on to creating the Board component, which will consist of 9 squares arranged in a grid.
This component will serve as the main playing area for our game.

The `Board` component should return a `<div>` element styled as a grid. The grid layout is achieved
using CSS Grid, with three columns and three rows, each taking up an equal fraction of the available
space. The overall size of the grid is determined by the width and height properties, ensuring that
it is square-shaped and appropriately sized.

Inside the grid, we place nine Square components, each with a value prop representing its position.
These Square components will eventually hold the game symbols (`'X'` or `'O'`) and handle user
interactions.

Here's the code for the `Board` component:

```jsx
export default function Board() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        width: 'calc(3 * 2.5rem)',
        height: 'calc(3 * 2.5rem)',
        border: '1px solid #999',
      }}
    >
      <Square value="1" />
      <Square value="2" />
      <Square value="3" />
      <Square value="4" />
      <Square value="5" />
      <Square value="6" />
      <Square value="7" />
      <Square value="8" />
      <Square value="9" />
    </div>
  )
}
```

This Board component sets up the basic structure for our game board by arranging nine squares in a
3x3 grid. It positions the squares neatly, providing a foundation for adding more features and
handling player interactions in the future.

### Lifting state up

Each `Square` component could maintain a part of the game's state. To check for a winner in a
tic-tac-toe game, the `Board` component would need to somehow know the state of each of the 9
`Square` components.

How would you approach that? At first, you might guess that the `Board` component needs to ask each
`Square` component for that `Square`'s component state. Although this approach is technically
possible in React, we discourage it because the code becomes difficult to understand, susceptible
to bugs, and hard to refactor. Instead, the best approach is to store the game's state in the
parent `Board` component instead of in each `Square` component. The `Board` component can tell each
`Square` component what to display by passing a prop, like you did when you passed a number to each
`Square` component.

> [!IMPORTANT]
> To collect data from multiple children, or to have two or more child components
> communicate with each other, declare the shared state in their parent component instead. The
> parent component can pass that state back down to the children via props. This keeps the child
> components in sync with each other and with their parent.

Let's take this opportunity to try it out. Edit the `Board` component so that it declares a state
variable named squares that defaults to an array of 9 nulls corresponding to the 9 squares:

```jsx
import { create } from 'zustand'
import { combine } from 'zustand/middleware'

const useGameStore = create(
  combine({ squares: Array(9).fill(null) }, (set) => {
    return {
      setSquares: (nextSquares) => {
        set((state) => ({
          squares:
            typeof nextSquares === 'function'
              ? nextSquares(state.squares)
              : nextSquares,
        }))
      },
    }
  }),
)

export default function Board() {
  const squares = useGameStore((state) => state.squares)
  const setSquares = useGameStore((state) => state.setSquares)

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        width: 'calc(3 * 2.5rem)',
        height: 'calc(3 * 2.5rem)',
        border: '1px solid #999',
      }}
    >
      {squares.map((square, squareIndex) => (
        <Square key={squareIndex} value={square} />
      ))}
    </div>
  )
}
```

`Array(9).fill(null)` creates an array with nine elements and sets each of them to `null`. The
`useGameStore` declares a `squares` state that's initially set to that array. Each entry in the
array corresponds to the value of a square. When you fill the board in later, the squares array
will look like this:

```js
const squares = ['O', null, 'X', 'X', 'X', 'O', 'O', null, null]
```

Each Square will now receive a `value` prop that will either be `'X'`, `'O'`, or `null` for empty
squares.

Next, you need to change what happens when a `Square` component is clicked. The `Board` component
now maintains which squares are filled. You'll need to create a way for the `Square` component to
update the `Board`'s component state. Since state is private to a component that defines it, you
cannot update the `Board`'s component state directly from `Square` component.

Instead, you'll pass down a function from the Board component to the `Square` component, and you'll
have `Square` component call that function when a square is clicked. You'll start with the function
that the `Square` component will call when it is clicked. You'll call that function `onSquareClick`:

Now you'll connect the `onSquareClick` prop to a function in the `Board` component that you'll name
`handleClick`. To connect `onSquareClick` to `handleClick` you'll pass an inline function to the
`onSquareClick` prop of the first Square component:

```jsx
<Square key={squareIndex} value={square} onSquareClick={() => handleClick(i)} />
```

Lastly, you will define the `handleClick` function inside the `Board` component to update the
squares array holding your board's state.

The `handleClick` function should take the index of the square to update and create a copy of the
`squares` array (`nextSquares`). Then, `handleClick` updates the `nextSquares` array by adding `X`
to the square at the specified index (`i`) if is not already filled.

```jsx {5-10,27}
export default function Board() {
  const squares = useGameStore((state) => state.squares)
  const setSquares = useGameStore((state) => state.setSquares)

  function handleClick(i) {
    if (squares[i]) return
    const nextSquares = squares.slice()
    nextSquares[i] = 'X'
    setSquares(nextSquares)
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        width: 'calc(3 * 2.5rem)',
        height: 'calc(3 * 2.5rem)',
        border: '1px solid #999',
      }}
    >
      {squares.map((square, squareIndex) => (
        <Square
          key={squareIndex}
          value={square}
          onSquareClick={() => handleClick(squareIndex)}
        />
      ))}
    </div>
  )
}
```

> [!IMPORTANT]
> Note how in `handleClick` function, you call `.slice()` to create a copy of the squares array
> instead of modifying the existing array.

### Taking turns

It's now time to fix a major defect in this tic-tac-toe game: the `'O'`s cannot be used on the
board.

You'll set the first move to be `'X'` by default. Let's keep track of this by adding another piece
of state to the `useGameStore` hook:

```jsx {2,12-18}
const useGameStore = create(
  combine({ squares: Array(9).fill(null), xIsNext: true }, (set) => {
    return {
      setSquares: (nextSquares) => {
        set((state) => ({
          squares:
            typeof nextSquares === 'function'
              ? nextSquares(state.squares)
              : nextSquares,
        }))
      },
      setXIsNext: (nextXIsNext) => {
        set((state) => ({
          xIsNext:
            typeof nextXIsNext === 'function'
              ? nextXIsNext(state.xIsNext)
              : nextXIsNext,
        }))
      },
    }
  }),
)
```

Each time a player moves, `xIsNext` (a boolean) will be flipped to determine which player goes next
and the game's state will be saved. You'll update the Board's `handleClick` function to flip the
value of `xIsNext`:

```jsx {2-3,6,11}
export default function Board() {
  const xIsNext = useGameStore((state) => state.xIsNext)
  const setXIsNext = useGameStore((state) => state.setXIsNext)
  const squares = useGameStore((state) => state.squares)
  const setSquares = useGameStore((state) => state.setSquares)
  const player = xIsNext ? 'X' : 'O'

  function handleClick(i) {
    if (squares[i]) return
    const nextSquares = squares.slice()
    nextSquares[i] = player
    setSquares(nextSquares)
    setXIsNext(!xIsNext)
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        width: 'calc(3 * 2.5rem)',
        height: 'calc(3 * 2.5rem)',
        border: '1px solid #999',
      }}
    >
      {squares.map((square, squareIndex) => (
        <Square
          key={squareIndex}
          value={square}
          onSquareClick={() => handleClick(squareIndex)}
        />
      ))}
    </div>
  )
}
```

### Declaring a winner or draw

Now that the players can take turns, you'll want to show when the game is won or drawn and there
are no more turns to make. To do this you'll add three helper functions. The first helper function
called `calculateWinner` that takes an array of 9 squares, checks for a winner and returns `'X'`,
`'O'`, or `null` as appropriate. The second helper function called `calculateTurns` that takes the
same array, checks for remaining turns by filtering out only `null` items, and returns the count of
them. The last helper called `calculateStatus` that takes the remaining turns, the winner, and the
current player (`'X' or 'O'`):

```js
function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ]

  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i]
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a]
    }
  }

  return null
}

function calculateTurns(squares) {
  return squares.filter((square) => !square).length
}

function calculateStatus(winner, turns, player) {
  if (!winner && !turns) return 'Draw'
  if (winner) return `Winner ${winner}`
  return `Next player: ${player}`
}
```

You will use the result of `calculateWinner(squares)` in the Board component's `handleClick`
function to check if a player has won. You can perform this check at the same time you check if a
user has clicked a square that already has a `'X'` or and `'O'`. We'd like to return early in
both cases:

```js {2}
function handleClick(i) {
  if (squares[i] || winner) return
  const nextSquares = squares.slice()
  nextSquares[i] = player'
  setSquares(nextSquares)
  setXIsNext(!xIsNext)
}
```

To let the players know when the game is over, you can display text such as `'Winner: X'` or
`'Winner: O'`. To do that you'll add a `status` section to the `Board` component. The status will
display the winner or draw if the game is over and if the game is ongoing you'll display which
player's turn is next:

```jsx {6-7,9,21}
export default function Board() {
  const xIsNext = useGameStore((state) => state.xIsNext)
  const setXIsNext = useGameStore((state) => state.setXIsNext)
  const squares = useGameStore((state) => state.squares)
  const setSquares = useGameStore((state) => state.setSquares)
  const winner = calculateWinner(squares)
  const turns = calculateTurns(squares)
  const player = xIsNext ? 'X' : 'O'
  const status = calculateStatus(winner, turns, player)

  function handleClick(i) {
    if (squares[i] || winner) return
    const nextSquares = squares.slice()
    nextSquares[i] = player
    setSquares(nextSquares)
    setXIsNext(!xIsNext)
  }

  return (
    <>
      <div style={{ marginBottom: '0.5rem' }}>{status}</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          width: 'calc(3 * 2.5rem)',
          height: 'calc(3 * 2.5rem)',
          border: '1px solid #999',
        }}
      >
        {squares.map((square, squareIndex) => (
          <Square
            key={squareIndex}
            value={square}
            onSquareClick={() => handleClick(squareIndex)}
          />
        ))}
      </div>
    </>
  )
}
```

Congratulations! You now have a working tic-tac-toe game. And you've just learned the basics of
React and Zustand too. So you are the real winner here. Here is what the code should look like:

```jsx
import { create } from 'zustand'
import { combine } from 'zustand/middleware'

const useGameStore = create(
  combine({ squares: Array(9).fill(null), xIsNext: true }, (set) => {
    return {
      setSquares: (nextSquares) => {
        set((state) => ({
          squares:
            typeof nextSquares === 'function'
              ? nextSquares(state.squares)
              : nextSquares,
        }))
      },
      setXIsNext: (nextXIsNext) => {
        set((state) => ({
          xIsNext:
            typeof nextXIsNext === 'function'
              ? nextXIsNext(state.xIsNext)
              : nextXIsNext,
        }))
      },
    }
  }),
)

function Square({ value, onSquareClick }) {
  return (
    <button
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        backgroundColor: '#fff',
        border: '1px solid #999',
        outline: 0,
        borderRadius: 0,
        fontSize: '1rem',
        fontWeight: 'bold',
      }}
      onClick={onSquareClick}
    >
      {value}
    </button>
  )
}

export default function Board() {
  const xIsNext = useGameStore((state) => state.xIsNext)
  const setXIsNext = useGameStore((state) => state.setXIsNext)
  const squares = useGameStore((state) => state.squares)
  const setSquares = useGameStore((state) => state.setSquares)
  const winner = calculateWinner(squares)
  const turns = calculateTurns(squares)
  const player = xIsNext ? 'X' : 'O'
  const status = calculateStatus(winner, turns, player)

  function handleClick(i) {
    if (squares[i] || winner) return
    const nextSquares = squares.slice()
    nextSquares[i] = player
    setSquares(nextSquares)
    setXIsNext(!xIsNext)
  }

  return (
    <>
      <div style={{ marginBottom: '0.5rem' }}>{status}</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          width: 'calc(3 * 2.5rem)',
          height: 'calc(3 * 2.5rem)',
          border: '1px solid #999',
        }}
      >
        {squares.map((square, squareIndex) => (
          <Square
            key={squareIndex}
            value={square}
            onSquareClick={() => handleClick(squareIndex)}
          />
        ))}
      </div>
    </>
  )
}

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ]

  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i]
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a]
    }
  }

  return null
}

function calculateTurns(squares) {
  return squares.filter((square) => !square).length
}

function calculateStatus(winner, turns, player) {
  if (!winner && !turns) return 'Draw'
  if (winner) return `Winner ${winner}`
  return `Next player: ${player}`
}
```

### Adding time travel

As a final exercise, let's make it possible to “go back in time” and revisit previous moves in the
game.

If you had directly modified the squares array, implementing this time-travel feature would be very
difficult. However, since you used `slice()` to create a new copy of the squares array after every
move, treating it as immutable, you can store every past version of the squares array and navigate
between them.

You'll keep track of these past squares arrays in a new state variable called `history`. This
`history` array will store all board states, from the first move to the latest one, and will look
something like this:

```js
const history = [
  // First move
  [null, null, null, null, null, null, null, null, null],
  // Second move
  ['X', null, null, null, null, null, null, null, null],
  // Third move
  ['X', 'O', null, null, null, null, null, null, null],
  // and so on...
]
```

This approach allows you to easily navigate between different game states and implement the
time-travel feature.

### Lifting state up, again

Next, you will create a new top-level component called `Game` to display a list of past moves. This
is where you will store the `history` state that contains the entire game history.

By placing the `history` state in the `Game` component, you can remove the `squares` state from the
`Board` component. You will now lift the state up from the `Board` component to the top-level `Game`
component. This change allows the `Game` component to have full control over the `Board`'s
component data and instruct the `Board` component to render previous turns from the `history`.

First, add a `Game` component with `export default` and remove it from `Board` component. Here is
what the code should look like:

```jsx {1,44-61}
function Board() {
  const xIsNext = useGameStore((state) => state.xIsNext)
  const setXIsNext = useGameStore((state) => state.setXIsNext)
  const squares = useGameStore((state) => state.squares)
  const setSquares = useGameStore((state) => state.setSquares)
  const winner = calculateWinner(squares)
  const turns = calculateTurns(squares)
  const player = xIsNext ? 'X' : 'O'
  const status = calculateStatus(winner, turns, player)

  function handleClick(i) {
    if (squares[i] || winner) return
    const nextSquares = squares.slice()
    nextSquares[i] = player
    setSquares(nextSquares)
    setXIsNext(!xIsNext)
  }

  return (
    <>
      <div style={{ marginBottom: '0.5rem' }}>{status}</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          width: 'calc(3 * 2.5rem)',
          height: 'calc(3 * 2.5rem)',
          border: '1px solid #999',
        }}
      >
        {squares.map((square, squareIndex) => (
          <Square
            key={squareIndex}
            value={square}
            onSquareClick={() => handleClick(squareIndex)}
          />
        ))}
      </div>
    </>
  )
}

export default function Game() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        fontFamily: 'monospace',
      }}
    >
      <div>
        <Board />
      </div>
      <div style={{ marginLeft: '1rem' }}>
        <ol>{/* TODO */}</ol>
      </div>
    </div>
  )
}
```

Add some state to the `useGameStore` hook to track the history of moves:

```js {2,4-11}
const useGameStore = create(
  combine({ history: [Array(9).fill(null)], xIsNext: true }, (set) => {
    return {
      setHistory: (nextHistory) => {
        set((state) => ({
          history:
            typeof nextHistory === 'function'
              ? nextHistory(state.history)
              : nextHistory,
        }))
      },
      setXIsNext: (nextXIsNext) => {
        set((state) => ({
          xIsNext:
            typeof nextXIsNext === 'function'
              ? nextXIsNext(state.xIsNext)
              : nextXIsNext,
        }))
      },
    }
  }),
)
```

Notice how `[Array(9).fill(null)]` creates an array with a single item, which is itself an array of
9 null values.

To render the squares for the current move, you'll need to read the most recent squares array from
the `history` state. You don't need an extra state for this because you already have enough
information to calculate it during rendering:

```jsx {2-6}
export default function Game() {
  const history = useGameStore((state) => state.history)
  const setHistory = useGameStore((state) => state.setHistory)
  const xIsNext = useGameStore((state) => state.xIsNext)
  const setXIsNext = useGameStore((state) => state.setXIsNext)
  const currentSquares = history[history.length - 1]

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        fontFamily: 'monospace',
      }}
    >
      <div>
        <Board />
      </div>
      <div style={{ marginLeft: '1rem' }}>
        <ol>{/*TODO*/}</ol>
      </div>
    </div>
  )
}
```

Next, create a `handlePlay` function inside the `Game` component that will be called by the `Board`
component to update the game. Pass `xIsNext`, `currentSquares` and `handlePlay` as props to the
`Board` component:

```jsx {8-10,21}
export default function Game() {
  const history = useGameStore((state) => state.history)
  const setHistory = useGameStore((state) => state.setHistory)
  const currentMove = useGameStore((state) => state.currentMove)
  const setCurrentMove = useGameStore((state) => state.setCurrentMove)
  const currentSquares = history[history.length - 1]

  function handlePlay(nextSquares) {
    // TODO
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        fontFamily: 'monospace',
      }}
    >
      <div>
        <Board xIsNext={xIsNext} squares={currentSquares} onPlay={handlePlay} />
      </div>
      <div style={{ marginLeft: '1rem' }}>
        <ol>{/*TODO*/}</ol>
      </div>
    </div>
  )
}
```

Let's make the `Board` component fully controlled by the props it receives. To do this, we'll modify
the `Board` component to accept three props: `xIsNext`, `squares`, and a new `onPlay` function that
the `Board` component can call with the updated squares array when a player makes a move.

```jsx {1}
function Board({ xIsNext, squares, onPlay }) {
  const winner = calculateWinner(squares)
  const turns = calculateTurns(squares)
  const player = xIsNext ? 'X' : 'O'
  const status = calculateStatus(winner, turns, player)

  function handleClick(i) {
    if (squares[i] || winner) return
    const nextSquares = squares.slice()
    nextSquares[i] = player
    onPlay(nextSquares)
  }

  return (
    <>
      <div style={{ marginBottom: '0.5rem' }}>{status}</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          width: 'calc(3 * 2.5rem)',
          height: 'calc(3 * 2.5rem)',
          border: '1px solid #999',
        }}
      >
        {squares.map((square, squareIndex) => (
          <Square
            key={squareIndex}
            value={square}
            onSquareClick={() => handleClick(squareIndex)}
          />
        ))}
      </div>
    </>
  )
}
```

The `Board` component is now fully controlled by the props passed to it by the `Game` component. To
get the game working again, you need to implement the `handlePlay` function in the `Game`
component.

What should `handlePlay` do when called? Previously, the `Board` component called `setSquares` with
an updated array; now it passes the updated squares array to `onPlay`.

The `handlePlay` function needs to update the `Game` component's state to trigger a re-render.
Instead of using `setSquares`, you'll update the `history` state variable by appending the updated
squares array as a new `history` entry. You also need to toggle `xIsNext`, just as the `Board`
component used
to do.

```js {2-3}
function handlePlay(nextSquares) {
  setHistory(history.concat([nextSquares]))
  setXIsNext(!xIsNext)
}
```

At this point, you've moved the state to live in the `Game` component, and the UI should be fully
working, just as it was before the refactor. Here is what the code should look like at this point:

```jsx
import { create } from 'zustand'
import { combine } from 'zustand/middleware'

const useGameStore = create(
  combine({ history: [Array(9).fill(null)], xIsNext: true }, (set) => {
    return {
      setHistory: (nextHistory) => {
        set((state) => ({
          history:
            typeof nextHistory === 'function'
              ? nextHistory(state.history)
              : nextHistory,
        }))
      },
      setXIsNext: (nextXIsNext) => {
        set((state) => ({
          xIsNext:
            typeof nextXIsNext === 'function'
              ? nextXIsNext(state.xIsNext)
              : nextXIsNext,
        }))
      },
    }
  }),
)

function Square({ value, onSquareClick }) {
  return (
    <button
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        backgroundColor: '#fff',
        border: '1px solid #999',
        outline: 0,
        borderRadius: 0,
        fontSize: '1rem',
        fontWeight: 'bold',
      }}
      onClick={onSquareClick}
    >
      {value}
    </button>
  )
}

function Board({ xIsNext, squares, onPlay }) {
  const winner = calculateWinner(squares)
  const turns = calculateTurns(squares)
  const player = xIsNext ? 'X' : 'O'
  const status = calculateStatus(winner, turns, player)

  function handleClick(i) {
    if (squares[i] || winner) return
    const nextSquares = squares.slice()
    nextSquares[i] = player
    onPlay(nextSquares)
  }

  return (
    <>
      <div style={{ marginBottom: '0.5rem' }}>{status}</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          width: 'calc(3 * 2.5rem)',
          height: 'calc(3 * 2.5rem)',
          border: '1px solid #999',
        }}
      >
        {squares.map((square, squareIndex) => (
          <Square
            key={squareIndex}
            value={square}
            onSquareClick={() => handleClick(squareIndex)}
          />
        ))}
      </div>
    </>
  )
}

export default function Game() {
  const history = useGameStore((state) => state.history)
  const setHistory = useGameStore((state) => state.setHistory)
  const xIsNext = useGameStore((state) => state.xIsNext)
  const setXIsNext = useGameStore((state) => state.setXIsNext)
  const currentSquares = history[history.length - 1]

  function handlePlay(nextSquares) {
    setHistory(history.concat([nextSquares]))
    setXIsNext(!xIsNext)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        fontFamily: 'monospace',
      }}
    >
      <div>
        <Board xIsNext={xIsNext} squares={currentSquares} onPlay={handlePlay} />
      </div>
      <div style={{ marginLeft: '1rem' }}>
        <ol>{/*TODO*/}</ol>
      </div>
    </div>
  )
}

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ]

  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i]
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a]
    }
  }

  return null
}

function calculateTurns(squares) {
  return squares.filter((square) => !square).length
}

function calculateStatus(winner, turns, player) {
  if (!winner && !turns) return 'Draw'
  if (winner) return `Winner ${winner}`
  return `Next player: ${player}`
}
```

### Showing the past moves

Since you are recording the tic-tac-toe game's history, you can now display a list of past moves to
the player.

You already have an array of `history` moves in store, so now you need to transform it to an array
of React elements. In JavaScript, to transform one array into another, you can use the Array
`.map()` method:

You'll use `map` to transform your `history` of moves into React elements representing buttons on the
screen, and display a list of buttons to **jump** to past moves. Let's `map` over the `history` in
the `Game` component:

```jsx {29-44}
export default function Game() {
  const history = useGameStore((state) => state.history)
  const setHistory = useGameStore((state) => state.setHistory)
  const xIsNext = useGameStore((state) => state.xIsNext)
  const setXIsNext = useGameStore((state) => state.setXIsNext)
  const currentSquares = history[history.length - 1]

  function handlePlay(nextSquares) {
    setHistory(history.concat([nextSquares]))
    setXIsNext(!xIsNext)
  }

  function jumpTo(nextMove) {
    // TODO
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        fontFamily: 'monospace',
      }}
    >
      <div>
        <Board xIsNext={xIsNext} squares={currentSquares} onPlay={handlePlay} />
      </div>
      <div style={{ marginLeft: '1rem' }}>
        <ol>
          {history.map((_, historyIndex) => {
            const description =
              historyIndex > 0
                ? `Go to move #${historyIndex}`
                : 'Go to game start'

            return (
              <li key={historyIndex}>
                <button onClick={() => jumpTo(historyIndex)}>
                  {description}
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
```

Before you can implement the `jumpTo` function, you need the `Game` component to keep track of which
step the user is currently viewing. To do this, define a new state variable called `currentMove`,
which will start at `0`:

```js {3,14-21}
const useGameStore = create(
  combine(
    { history: [Array(9).fill(null)], currentMove: 0, xIsNext: true },
    (set) => {
      return {
        setHistory: (nextHistory) => {
          set((state) => ({
            history:
              typeof nextHistory === 'function'
                ? nextHistory(state.history)
                : nextHistory,
          }))
        },
        setCurrentMove: (nextCurrentMove) => {
          set((state) => ({
            currentMove:
              typeof nextCurrentMove === 'function'
                ? nextCurrentMove(state.currentMove)
                : nextCurrentMove,
          }))
        },
        setXIsNext: (nextXIsNext) => {
          set((state) => ({
            xIsNext:
              typeof nextXIsNext === 'function'
                ? nextXIsNext(state.xIsNext)
                : nextXIsNext,
          }))
        },
      }
    },
  ),
)
```

Next, update the `jumpTo` function inside `Game` component to update that `currentMove`. You’ll
also set `xIsNext` to `true` if the number that you’re changing `currentMove` to is even.

```js {2-3}
function jumpTo(nextMove) {
  setCurrentMove(nextMove)
  setXIsNext(currentMove % 2 === 0)
}
```

You will now make two changes to the `handlePlay` function in the `Game` component, which is called
when you click on a square.

- If you "go back in time" and then make a new move from that point, you only want to keep the
  history up to that point. Instead of adding `nextSquares` after all items in the history (using
  the Array `.concat()` method), you'll add it after all items in
  `history.slice(0, currentMove + 1)` to keep only that portion of the old history.
- Each time a move is made, you need to update `currentMove` to point to the latest history entry.

```js {2-4}
function handlePlay(nextSquares) {
  const nextHistory = history.slice(0, currentMove + 1).concat([nextSquares])
  setHistory(nextHistory)
  setCurrentMove(nextHistory.length - 1)
  setXIsNext(!xIsNext)
}
```

Finally, you will modify the `Game` component to render the currently selected move, instead of
always rendering the final move:

```jsx {2-8}
export default function Game() {
  const history = useGameStore((state) => state.history)
  const setHistory = useGameStore((state) => state.setHistory)
  const currentMove = useGameStore((state) => state.currentMove)
  const setCurrentMove = useGameStore((state) => state.setCurrentMove)
  const xIsNext = useGameStore((state) => state.xIsNext)
  const setXIsNext = useGameStore((state) => state.setXIsNext)
  const currentSquares = history[currentMove]

  function handlePlay(nextSquares) {
    const nextHistory = history.slice(0, currentMove + 1).concat([nextSquares])
    setHistory(nextHistory)
    setCurrentMove(nextHistory.length - 1)
    setXIsNext(!xIsNext)
  }

  function jumpTo(nextMove) {
    setCurrentMove(nextMove)
    setXIsNext(nextMove % 2 === 0)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        fontFamily: 'monospace',
      }}
    >
      <div>
        <Board xIsNext={xIsNext} squares={currentSquares} onPlay={handlePlay} />
      </div>
      <div style={{ marginLeft: '1rem' }}>
        <ol>
          {history.map((_, historyIndex) => {
            const description =
              historyIndex > 0
                ? `Go to move #${historyIndex}`
                : 'Go to game start'

            return (
              <li key={historyIndex}>
                <button onClick={() => jumpTo(historyIndex)}>
                  {description}
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
```

### Final cleanup

If you look closely at the code, you'll see that `xIsNext` is `true` when `currentMove` is even and
`false` when `currentMove` is odd. This means that if you know the value of `currentMove`, you can
always determine what `xIsNext` should be.

There's no need to store `xIsNext` separately in the state. It’s better to avoid redundant state
because it can reduce bugs and make your code easier to understand. Instead, you can calculate
`xIsNext` based on `currentMove`:

```jsx {2-5,13,17}
export default function Game() {
  const history = useGameStore((state) => state.history)
  const setHistory = useGameStore((state) => state.setHistory)
  const currentMove = useGameStore((state) => state.currentMove)
  const setCurrentMove = useGameStore((state) => state.setCurrentMove)
  const xIsNext = currentMove % 2 === 0
  const currentSquares = history[currentMove]

  function handlePlay(nextSquares) {
    const nextHistory = history.slice(0, currentMove + 1).concat([nextSquares])
    setHistory(nextHistory)
    setCurrentMove(nextHistory.length - 1)
  }

  function jumpTo(nextMove) {
    setCurrentMove(nextMove)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        fontFamily: 'monospace',
      }}
    >
      <div>
        <Board xIsNext={xIsNext} squares={currentSquares} onPlay={handlePlay} />
      </div>
      <div style={{ marginLeft: '1rem' }}>
        <ol>
          {history.map((_, historyIndex) => {
            const description =
              historyIndex > 0
                ? `Go to move #${historyIndex}`
                : 'Go to game start'

            return (
              <li key={historyIndex}>
                <button onClick={() => jumpTo(historyIndex)}>
                  {description}
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
```

You no longer need the `xIsNext` state declaration or the calls to `setXIsNext`. Now, there’s no
chance for `xIsNext` to get out of sync with `currentMove`, even if you make a mistake while coding
the components.

### Wrapping up

Congratulations! You’ve created a tic-tac-toe game that:

- Lets you play tic-tac-toe,
- Indicates when a player has won the game or when is drawn,
- Stores a game’s history as a game progresses,
- Allows players to review a game’s history and see previous versions of a game’s board.

Nice work! We hope you now feel like you have a decent grasp of how React and Zustand works.
