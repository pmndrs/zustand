const isIterable = (obj: object): obj is Iterable<unknown> =>
  Symbol.iterator in obj

const compareMapLike = (
  iterableA: Iterable<[unknown, unknown]>,
  iterableB: Iterable<[unknown, unknown]>,
) => {
  const mapA = iterableA instanceof Map ? iterableA : new Map(iterableA)
  const mapB = iterableB instanceof Map ? iterableB : new Map(iterableB)
  if (mapA.size !== mapB.size) return false
  for (const [key, value] of mapA) {
    if (!Object.is(value, mapB.get(key))) {
      return false
    }
  }
  return true
}

export function shallow<T>(objA: T, objB: T): boolean {
  if (Object.is(objA, objB)) {
    return true
  }
  if (
    typeof objA !== 'object' ||
    objA === null ||
    typeof objB !== 'object' ||
    objB === null
  ) {
    return false
  }

  if (isIterable(objA) && isIterable(objB)) {
    const iteratorA = objA[Symbol.iterator]()
    const iteratorB = objB[Symbol.iterator]()
    let nextA = iteratorA.next()
    let nextB = iteratorB.next()
    if (
      Array.isArray(nextA.value) &&
      Array.isArray(nextB.value) &&
      nextA.value.length === 2 &&
      nextB.value.length === 2
    ) {
      return compareMapLike(
        objA as Iterable<[unknown, unknown]>,
        objB as Iterable<[unknown, unknown]>,
      )
    }
    while (!nextA.done && !nextB.done) {
      if (!Object.is(nextA.value, nextB.value)) {
        return false
      }
      nextA = iteratorA.next()
      nextB = iteratorB.next()
    }
    return !!nextA.done && !!nextB.done
  }

  const keysA = Object.keys(objA)
  if (keysA.length !== Object.keys(objB).length) {
    return false
  }
  for (const keyA of keysA) {
    if (
      !Object.hasOwn(objB, keyA as string) ||
      !Object.is(objA[keyA as keyof T], objB[keyA as keyof T])
    ) {
      return false
    }
  }
  return true
}
