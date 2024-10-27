const hasIterableEntries = (
  obj: object,
): obj is {
  entries(): Iterable<[unknown, unknown]>
} =>
  // HACK: avoid checking entries type with just checking Symbol.iterator
  Symbol.iterator in obj && 'entries' in obj

const toObject = (value: { entries(): Iterable<[unknown, unknown]> }) =>
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

  if (hasIterableEntries(objA) && hasIterableEntries(objB)) {
    return compareObjects(toObject(objA), toObject(objB))
  }

  return compareObjects(objA, objB)
}
