/**
 * Functional programming utilities
 */

import type { Result } from '../types.ts'

/**
 * Pipe function - compose functions from left to right
 */
export const pipe =
  <T>(...fns: readonly ((arg: T) => T)[]) =>
  (initial: T): T =>
    fns.reduce((acc, fn) => fn(acc), initial)

/**
 * Async pipe function
 */
export const pipeAsync =
  <T>(...fns: readonly ((arg: T) => Promise<T>)[]) =>
  async (initial: T): Promise<T> =>
    await fns.reduce(
      async (acc, fn) => await fn(await acc),
      Promise.resolve(initial)
    )

/**
 * Compose function - compose functions from right to left
 */
export const compose =
  <T>(...fns: readonly ((arg: T) => T)[]) =>
  (initial: T): T =>
    fns.reduceRight((acc, fn) => fn(acc), initial)

/**
 * Create a Result success value
 */
export const ok = <T, E>(value: T): Result<T, E> => ({
  ok: true,
  value,
})

/**
 * Create a Result error value
 */
export const err = <T, E>(error: E): Result<T, E> => ({
  ok: false,
  error,
})

/**
 * Map over a Result
 */
export const mapResult = <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> => {
  if (result.ok) {
    return ok(fn(result.value))
  }
  return result
}

/**
 * FlatMap over a Result
 */
export const flatMapResult = <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> => {
  if (result.ok) {
    return fn(result.value)
  }
  return result
}

/**
 * Get value from Result or throw
 */
export const unwrap = <T, E>(result: Result<T, E>): T => {
  if (result.ok) {
    return result.value
  }
  throw result.error
}

/**
 * Get value from Result or return default
 */
export const unwrapOr = <T, E>(result: Result<T, E>, defaultValue: T): T => {
  if (result.ok) {
    return result.value
  }
  return defaultValue
}

/**
 * Deep freeze an object to make it immutable
 */
export const deepFreeze = <T>(obj: T): T => {
  Object.freeze(obj)
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const value = (obj as Record<string, unknown>)[prop]
    if (value !== null && typeof value === 'object') {
      deepFreeze(value)
    }
  })
  return obj
}

/**
 * Merge objects immutably
 */
export const merge = <T extends Record<string, unknown>>(
  ...objects: readonly T[]
): T => {
  return Object.assign({}, ...objects) as T
}

/**
 * Deep merge objects immutably
 */
export const deepMerge = <T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T => {
  const result: Record<string, unknown> = { ...target }

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key]
      const targetValue = target[key]

      if (
        typeof sourceValue === 'object' &&
        sourceValue !== null &&
        !Array.isArray(sourceValue) &&
        typeof targetValue === 'object' &&
        targetValue !== null &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>
        )
      } else {
        result[key] = sourceValue
      }
    }
  }

  return result as T
}

/**
 * Pick specific keys from an object
 */
export const pick = <T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: readonly K[]
): Pick<T, K> => {
  const result: Partial<Pick<T, K>> = {}
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key]
    }
  }
  return result as Pick<T, K>
}

/**
 * Omit specific keys from an object
 */
export const omit = <T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: readonly K[]
): Omit<T, K> => {
  const result: Record<string, unknown> = { ...obj }
  for (const key of keys) {
    delete result[key as string]
  }
  return result as Omit<T, K>
}

/**
 * Filter array with type guard
 */
export const filter = <T, S extends T>(
  array: readonly T[],
  predicate: (value: T) => value is S
): readonly S[] => {
  return array.filter(predicate)
}

/**
 * Partition array into two arrays based on predicate
 */
export const partition = <T>(
  array: readonly T[],
  predicate: (value: T) => boolean
): readonly [readonly T[], readonly T[]] => {
  const truthy: T[] = []
  const falsy: T[] = []

  for (const item of array) {
    if (predicate(item)) {
      truthy.push(item)
    } else {
      falsy.push(item)
    }
  }

  return [truthy, falsy] as const
}

/**
 * Group array by key function
 */
export const groupBy = <T, K extends string | number | symbol>(
  array: readonly T[],
  keyFn: (value: T) => K
): Record<K, readonly T[]> => {
  const result: Record<K, T[]> = {} as Record<K, T[]>

  for (const item of array) {
    const key = keyFn(item)
    if (!result[key]) {
      result[key] = []
    }
    result[key]?.push(item)
  }

  return result as Record<K, readonly T[]>
}

/**
 * Find first element that satisfies predicate
 */
export const findFirst = <T>(
  array: readonly T[],
  predicate: (value: T) => boolean
): T | undefined => {
  return array.find(predicate)
}

/**
 * Check if all elements satisfy predicate
 */
export const all = <T>(
  array: readonly T[],
  predicate: (value: T) => boolean
): boolean => {
  return array.every(predicate)
}

/**
 * Check if any element satisfies predicate
 */
export const any = <T>(
  array: readonly T[],
  predicate: (value: T) => boolean
): boolean => {
  return array.some(predicate)
}

/**
 * Unique values in array
 */
export const unique = <T>(array: readonly T[]): readonly T[] => {
  return [...new Set(array)]
}

/**
 * Flatten nested arrays
 */
export const flatten = <T>(array: readonly (T | readonly T[])[]): readonly T[] => {
  return array.flat() as readonly T[]
}

/**
 * Try-catch wrapper that returns Result
 */
export const tryCatch = <T, E = Error>(
  fn: () => T,
  onError: (error: unknown) => E
): Result<T, E> => {
  try {
    return ok(fn())
  } catch (error) {
    return err(onError(error))
  }
}

/**
 * Async try-catch wrapper that returns Result
 */
export const tryCatchAsync = async <T, E = Error>(
  fn: () => Promise<T>,
  onError: (error: unknown) => E
): Promise<Result<T, E>> => {
  try {
    return ok(await fn())
  } catch (error) {
    return err(onError(error))
  }
}
