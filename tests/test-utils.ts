type ReplacedMap = {
  type: 'Map'
  value: [string, unknown][]
}

export const replacer = (
  key: string,
  value: unknown,
): ReplacedMap | unknown => {
  if (value instanceof Map) {
    return {
      type: 'Map',
      value: Array.from(value.entries()),
    }
  } else {
    return value
  }
}

export const reviver = (key: string, value: ReplacedMap | unknown) => {
  if (isReplacedMap(value)) {
    return new Map(value.value)
  }
  return value
}

const isReplacedMap = (value: any): value is ReplacedMap => {
  if (value && value.type === 'Map') {
    return true
  }

  return false
}
