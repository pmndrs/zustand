function shallow<
  T extends (...args: unknown[]) => unknown,
  U extends (...args: unknown[]) => unknown
>(objA: T, objB: U): boolean

function shallow<
  T extends string | number | boolean,
  U extends string | number | boolean
>(objA: T, objB: U): boolean

function shallow<T extends unknown[], U extends unknown[]>(
  objA: T,
  objB: U
): boolean

function shallow<
  T extends Record<string, unknown>,
  U extends Record<string, unknown>
>(objA: T, objB: U): boolean

function shallow<T, U>(objA: T, objB: U) {
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
  const keysA = Object.keys(objA)
  if (keysA.length !== Object.keys(objB).length) {
    return false
  }
  for (let i = 0; i < keysA.length; i++) {
    if (
      !Object.prototype.hasOwnProperty.call(objB, keysA[i] as string) ||
      !Object.is(objA[keysA[i] as keyof T], objB[keysA[i] as keyof U])
    ) {
      return false
    }
  }
  return true
}

export default shallow
