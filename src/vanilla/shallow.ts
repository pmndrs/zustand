type IterableLike<T> = Iterable<T> & {
  entries: Map<string, T>['entries'] | Set<T>['entries'] | Array<T>['entries']
}

const isIterable = (obj: object): obj is IterableLike<unknown> =>
  Symbol.iterator in obj

const toObject = (value: IterableLike<unknown>) =>
  Object.fromEntries(value.entries())

const compareObjects = <T extends object>(objA: T, objB: T) => {
  const keysA = Object.keys(objA)
  if (keysA.length !== Object.keys(objB).length) return false
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

  if (isIterable(objA) && isIterable(objB)) {
    return compareObjects(toObject(objA), toObject(objB))
  }

  return compareObjects(objA, objB)
}
