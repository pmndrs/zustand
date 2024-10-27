type IterableLike<T> = Map<unknown, T> | Set<T> | Array<T>

const hasIterableEntries = (obj: object): obj is IterableLike<unknown> =>
  Symbol.iterator in obj

const toObject = (value: IterableLike<unknown>) =>
  Object.fromEntries(value.entries())

const compareKeys = (
  objA: IterableLike<unknown>,
  objB: IterableLike<unknown>,
) => {
  const keysA = Array.from(objA.keys()).toSorted()
  const keysB = Array.from(objB.keys()).toSorted()

  if (keysA.length !== keysB.length) return false
  return keysA.reduce(
    (output, keyA, keyAIndex) => output && Object.is(keyA, keysB[keyAIndex]),
    true,
  )
}

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

  if (hasIterableEntries(objA) && hasIterableEntries(objB)) {
    if (!compareKeys(objA, objB)) return false
    return compareObjects(toObject(objA), toObject(objB))
  }

  return compareObjects(objA, objB)
}
