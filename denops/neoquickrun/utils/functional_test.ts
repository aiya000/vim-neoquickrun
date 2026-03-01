/**
 * Tests for utils/functional.ts
 */

import assert from 'node:assert'
const assertEquals = assert.deepStrictEqual.bind(assert)
const assertThrows = (fn: () => void) => assert.throws(fn)
import {
  pipe,
  pipeAsync,
  compose,
  ok,
  err,
  mapResult,
  flatMapResult,
  unwrap,
  unwrapOr,
  merge,
  deepMerge,
  pick,
  omit,
  filter,
  partition,
  groupBy,
  findFirst,
  all,
  any,
  unique,
  flatten,
  tryCatch,
  tryCatchAsync,
} from './functional.ts'

Deno.test('pipe - applies functions left to right', () => {
  const add1 = (n: number) => n + 1
  const double = (n: number) => n * 2
  const result = pipe(add1, double)(3)
  assertEquals(result, 8)
})

Deno.test('pipe - identity with no functions', () => {
  const result = pipe<number>()(5)
  assertEquals(result, 5)
})

Deno.test('pipeAsync - applies async functions left to right', async () => {
  const add1 = async (n: number) => n + 1
  const double = async (n: number) => n * 2
  const result = await pipeAsync(add1, double)(3)
  assertEquals(result, 8)
})

Deno.test('compose - applies functions right to left', () => {
  const add1 = (n: number) => n + 1
  const double = (n: number) => n * 2
  const result = compose(add1, double)(3)
  assertEquals(result, 7)
})

Deno.test('ok - creates a success result', () => {
  const result = ok(42)
  assertEquals(result, { ok: true, value: 42 })
})

Deno.test('err - creates an error result', () => {
  const result = err('something went wrong')
  assertEquals(result, { ok: false, error: 'something went wrong' })
})

Deno.test('mapResult - maps over ok result', () => {
  const result = mapResult(ok(5), (n) => n * 2)
  assertEquals(result, { ok: true, value: 10 })
})

Deno.test('mapResult - passes through err result', () => {
  const result = mapResult(err<number, string>('error'), (n) => n * 2)
  assertEquals(result, { ok: false, error: 'error' })
})

Deno.test('flatMapResult - chains ok results', () => {
  const result = flatMapResult(ok(5), (n) => ok(n * 2))
  assertEquals(result, { ok: true, value: 10 })
})

Deno.test('flatMapResult - passes through err result', () => {
  const result = flatMapResult(err<number, string>('error'), (n) => ok(n * 2))
  assertEquals(result, { ok: false, error: 'error' })
})

Deno.test('flatMapResult - chains to err', () => {
  const result = flatMapResult(ok(5), (_n) => err<number, string>('new error'))
  assertEquals(result, { ok: false, error: 'new error' })
})

Deno.test('unwrap - returns value for ok result', () => {
  assertEquals(unwrap(ok(42)), 42)
})

Deno.test('unwrap - throws for err result', () => {
  assertThrows(() => unwrap(err('error')))
})

Deno.test('unwrapOr - returns value for ok result', () => {
  assertEquals(unwrapOr(ok(42), 0), 42)
})

Deno.test('unwrapOr - returns default for err result', () => {
  assertEquals(unwrapOr(err<number, string>('error'), 99), 99)
})

Deno.test('merge - merges objects shallowly', () => {
  const result = merge({ a: 1, b: 2 } as Record<string, number>, { b: 3, c: 4 } as Record<string, number>)
  assertEquals(result, { a: 1, b: 3, c: 4 })
})

Deno.test('deepMerge - merges nested objects', () => {
  const target = { a: 1, nested: { x: 1, y: 2 } } as Record<string, unknown>
  const source = { nested: { y: 3, z: 4 } } as Record<string, unknown>
  const result = deepMerge(target, source)
  assertEquals(result, { a: 1, nested: { x: 1, y: 3, z: 4 } })
})

Deno.test('deepMerge - overwrites with arrays (no deep merge for arrays)', () => {
  const target = { arr: [1, 2] } as Record<string, unknown>
  const source = { arr: [3, 4, 5] } as Record<string, unknown>
  const result = deepMerge(target, source)
  assertEquals(result, { arr: [3, 4, 5] })
})

Deno.test('deepMerge - source overrides primitive values', () => {
  const target = { a: 1 } as Record<string, unknown>
  const source = { a: 2 } as Record<string, unknown>
  const result = deepMerge(target, source)
  assertEquals(result, { a: 2 })
})

Deno.test('pick - picks specified keys', () => {
  const obj = { a: 1, b: 2, c: 3 } as Record<string, number>
  const result = pick(obj, ['a', 'c'] as const)
  assertEquals(result, { a: 1, c: 3 })
})

Deno.test('omit - omits specified keys', () => {
  const obj = { a: 1, b: 2, c: 3 } as Record<string, number>
  const result = omit(obj, ['b'] as const)
  assertEquals(result, { a: 1, c: 3 })
})

Deno.test('filter - filters with type guard', () => {
  const isString = (v: unknown): v is string => typeof v === 'string'
  const arr = [1, 'hello', 2, 'world']
  const result = filter(arr, isString)
  assertEquals(result, ['hello', 'world'])
})

Deno.test('partition - partitions array by predicate', () => {
  const [evens, odds] = partition([1, 2, 3, 4, 5], (n) => n % 2 === 0)
  assertEquals(evens, [2, 4])
  assertEquals(odds, [1, 3, 5])
})

Deno.test('groupBy - groups by key function', () => {
  const result = groupBy(['one', 'two', 'three', 'four'], (s) => s.length)
  assertEquals(result[3], ['one', 'two'])
  assertEquals(result[4], ['four'])
  assertEquals(result[5], ['three'])
})

Deno.test('findFirst - finds first matching element', () => {
  const result = findFirst([1, 2, 3, 4], (n) => n > 2)
  assertEquals(result, 3)
})

Deno.test('findFirst - returns undefined if not found', () => {
  const result = findFirst([1, 2, 3], (n) => n > 10)
  assertEquals(result, undefined)
})

Deno.test('all - returns true when all satisfy predicate', () => {
  assertEquals(all([2, 4, 6], (n) => n % 2 === 0), true)
})

Deno.test('all - returns false when some do not satisfy predicate', () => {
  assertEquals(all([2, 3, 6], (n) => n % 2 === 0), false)
})

Deno.test('any - returns true when some satisfy predicate', () => {
  assertEquals(any([1, 3, 4], (n) => n % 2 === 0), true)
})

Deno.test('any - returns false when none satisfy predicate', () => {
  assertEquals(any([1, 3, 5], (n) => n % 2 === 0), false)
})

Deno.test('unique - removes duplicates', () => {
  const result = unique([1, 2, 2, 3, 1])
  assertEquals(result, [1, 2, 3])
})

Deno.test('flatten - flattens one level', () => {
  const result = flatten([[1, 2], [3, 4], [5]])
  assertEquals(result, [1, 2, 3, 4, 5])
})

Deno.test('tryCatch - returns ok on success', () => {
  const result = tryCatch(
    () => 42,
    (e) => String(e)
  )
  assertEquals(result, { ok: true, value: 42 })
})

Deno.test('tryCatch - returns err on failure', () => {
  const result = tryCatch(
    () => { throw new Error('oops') },
    (e) => String(e)
  )
  assertEquals(result.ok, false)
})

Deno.test('tryCatchAsync - returns ok on success', async () => {
  const result = await tryCatchAsync(
    async () => 42,
    (e) => String(e)
  )
  assertEquals(result, { ok: true, value: 42 })
})

Deno.test('tryCatchAsync - returns err on failure', async () => {
  const result = await tryCatchAsync(
    async () => { throw new Error('oops') },
    (e) => String(e)
  )
  assertEquals(result.ok, false)
})
