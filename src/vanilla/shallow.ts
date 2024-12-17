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
): boolean => {
  if (
    'size' in valueA &&
    'size' in valueB &&
    (valueA as { size: number }).size !== (valueB as { size: number }).size
  ) {
    return false
  }

  const mapA = valueA instanceof Map ? valueA : new Map(valueA.entries())
  const mapB = valueB instanceof Map ? valueB : new Map(valueB.entries())

  if (mapA.size !== mapB.size) {
    return false
  }

  const compared = new WeakMap()

  for (const [key, value] of mapA) {
    if (typeof key === 'object' && key !== null && compared.has(key)) {
      continue
    }

    const valueB = mapB.get(key)
    if (!Object.is(value, valueB)) {
      return false
    }

    if (typeof key === 'object' && key !== null) {
      compared.set(key, true)
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

export function shallow<T>(valueA: T, valueB: T): boolean {
  if (Object.is(valueA, valueB)) {
    return true
  }
  if (
    typeof valueA !== 'object' ||
    valueA === null ||
    typeof valueB !== 'object' ||
    valueB === null
  ) {
    return false
  }
  if (!isIterable(valueA) || !isIterable(valueB)) {
    return compareEntries(
      { entries: () => Object.entries(valueA) },
      { entries: () => Object.entries(valueB) },
    )
  }
  if (hasIterableEntries(valueA) && hasIterableEntries(valueB)) {
    return compareEntries(valueA, valueB)
  }
  return compareIterables(valueA, valueB)
}
