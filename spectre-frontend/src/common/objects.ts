// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function deepClone<T>(value: T, cache = new WeakMap<object, any>()): T {
  if (value === null || typeof value !== 'object') {
    return value
  }

  if (cache.has(value as object)) {
    return cache.get(value as object)
  }

  if (value instanceof Date) {
    return new Date(value.getTime()) as T
  }

  if (value instanceof Map) {
    const result = new Map()
    cache.set(value, result)

    value.forEach((v, k) => {
      result.set(deepClone(k, cache), deepClone(v, cache))
    })

    return result as T
  }

  if (value instanceof Set) {
    const result = new Set()
    cache.set(value, result)

    value.forEach((v) => {
      result.add(deepClone(v, cache))
    })

    return result as T
  }

  if (Array.isArray(value)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any[] = []
    cache.set(value, result)

    for (let i = 0; i < value.length; i++) {
      result[i] = deepClone(value[i], cache)
    }

    return result as T
  }

  const result = Object.create(Object.getPrototypeOf(value))
  cache.set(value as object, result)

  for (const key of Reflect.ownKeys(value as object)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result[key] = deepClone((value as any)[key], cache)
  }

  return result
}
