type IterableLike<T> = Map<unknown, T> | Set<T> | Array<T>

const hasIterableEntries = (obj: object): obj is IterableLike<unknown> =>
  Symbol.iterator in obj

const toObject = (value: IterableLike<unknown>) =>
  Object.fromEntries(value.entries())

const compKeys = (objA: IterableLike<unknown>, objB: IterableLike<unknown>) => {
  const keysA = Array.from(objA.keys()).sort()
  const keysB = Array.from(objB.keys()).sort()

  if (keysA.length !== keysB.length) return false
  return keysA.reduce((o, keyA, idx) => o && Object.is(keyA, keysB[idx]), true)
}

const compObjects = <T extends object>(objA: T, objB: T) => {
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
    if (!compKeys(objA, objB)) return false
    return compObjects(toObject(objA), toObject(objB))
  }

  return compObjects(objA, objB)
}
