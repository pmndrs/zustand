export const isObject = (o: Object) => o?.toString() === '[object Object]'

export const deepMerge = <T extends Object, S extends Object>(
  target: T,
  source?: S
): T & S => {
  if (!source) return target as T & S

  const mergedObject: Partial<T & S> = {}
  const mergedEntries: [keyof T & S, (T & S)[keyof T & S]][] = Object.entries(
    target
  ).concat(Object.entries(source)) as any

  mergedEntries.forEach(([key, value]) => {
    if (isObject(target[key]) && isObject(value)) {
      mergedObject[key] = deepMerge(target[key], value)
    } else {
      mergedObject[key] = value
    }
  })

  return mergedObject as T & S
}
