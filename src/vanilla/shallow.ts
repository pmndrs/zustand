const isIterable = (obj: object): obj is Iterable<unknown> =>
  Symbol.iterator in obj

const hasIterableEntries = (
  value: Iterable<unknown>,
): value is Iterable<unknown> & {
  entries(): Iterable<[unknown, unknown]>
} =>
  // HACK: avoid checking entries type
  'entries' in value

const compareEntries = (
  valueA: { entries(): Iterable<[unknown, unknown]> },
  valueB: { entries(): Iterable<[unknown, unknown]> },
) => {
  const mapA = valueA instanceof Map ? valueA : new Map(valueA.entries())
  const mapB = valueB instanceof Map ? valueB : new Map(valueB.entries())
  if (mapA.size !== mapB.size) return false
  for (const [key, value] of mapA) {
    if (!Object.is(value, mapB.get(key))) {
      return false
    }
  }
  return true
}

// Ordered iterables
const compareIterables = (
  valueA: Iterable<unknown>,
  valueB: Iterable<unknown>,
) => {
  const iteratorA = valueA[Symbol.iterator]()
  const iteratorB = valueB[Symbol.iterator]()
  let nextA = iteratorA.next()
  let nextB = iteratorB.next()
  while (!nextA.done && !nextB.done) {
    if (!Object.is(nextA.value, nextB.value)) {
      return false
    }
    nextA = iteratorA.next()
    nextB = iteratorB.next()
  }
  return !!nextA.done && !!nextB.done
}

export function shallow<T>(objA: T, objB: T): boolean {
  if (Object.is(objA, objB)) return true
  if (
    typeof objA !== 'object' ||
    objA === null ||
    typeof objB !== 'object' ||
    objB === null
  ) {
    return false
  }

  if (!isIterable(objA) || !isIterable(objB)) {
    return compareEntries(
      { entries: () => Object.entries(objA) },
      { entries: () => Object.entries(objB) },
    )
  }

  if (hasIterableEntries(objA) && hasIterableEntries(objB)) {
    return compareEntries(objA, objB)
  }
  return compareIterables(objA, objB)
}
