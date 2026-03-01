/**
 * Tests for hook/eval.ts
 */

import assert from 'node:assert'
const assertEquals = assert.deepStrictEqual.bind(assert)
import { createEvalHook } from './eval.ts'
import { createMockContext } from '../utils/mock_denops.ts'

Deno.test('eval hook - has correct name', () => {
  const hook = createEvalHook({})
  assertEquals(hook.name, 'eval')
})

Deno.test('eval hook - returns context unchanged when no template', async () => {
  const hook = createEvalHook({})
  const context = createMockContext({ src: 'print(1)' })

  const result = await hook.on_normalized!(context)
  assertEquals(result.src, 'print(1)')
})

Deno.test('eval hook - wraps src with template replacing %s', async () => {
  const hook = createEvalHook({ 'hook/eval/template': 'begin\n%s\nend' })
  const context = createMockContext({ src: 'puts "hello"' })

  const result = await hook.on_normalized!(context)
  assertEquals(result.src, 'begin\nputs "hello"\nend')
})

Deno.test('eval hook - replaces multiple %s occurrences', async () => {
  const hook = createEvalHook({ 'hook/eval/template': '%s and %s' })
  const context = createMockContext({ src: 'code' })

  const result = await hook.on_normalized!(context)
  assertEquals(result.src, 'code and code')
})

Deno.test('eval hook - returns context with other fields preserved', async () => {
  const hook = createEvalHook({ 'hook/eval/template': 'wrap(%s)' })
  const context = createMockContext({
    src: 'x = 1',
    config: { type: 'python' },
  })

  const result = await hook.on_normalized!(context)
  assertEquals(result.src, 'wrap(x = 1)')
  assertEquals(result.config.type, 'python')
})

Deno.test('eval hook - priority returns a number', () => {
  const hook = createEvalHook({})
  const priority = hook.priority('normalized')
  assertEquals(typeof priority, 'number')
})
