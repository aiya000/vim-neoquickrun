/**
 * Tests for hook/shebang.ts
 */

import assert from 'node:assert'
const assertEquals = assert.deepStrictEqual.bind(assert)
import { createShebangHook } from './shebang.ts'
import { createMockContext } from '../utils/mock_denops.ts'

Deno.test('shebang hook - has correct name', () => {
  const hook = createShebangHook({})
  assertEquals(hook.name, 'shebang')
})

Deno.test('shebang hook - on_normalized returns context unchanged when no shebang', async () => {
  const hook = createShebangHook({})
  const context = createMockContext({ src: 'print("hello")' })

  const result = await hook.on_normalized!(context)
  assertEquals(result.config, context.config)
  assertEquals(result.src, context.src)
})

Deno.test('shebang hook - on_normalized extracts shebang command', async () => {
  const hook = createShebangHook({})
  const context = createMockContext({
    src: '#!/usr/bin/env python3\nprint("hello")',
    config: { exec: '%c %s' },
  })

  const result = await hook.on_normalized!(context)
  assertEquals(result.config.command, '/usr/bin/env python3')
  assertEquals(result.config.exec, '%C %s')
})

Deno.test('shebang hook - on_normalized returns unchanged context for empty src', async () => {
  const hook = createShebangHook({})
  const context = createMockContext({ src: '' })

  const result = await hook.on_normalized!(context)
  assertEquals(result.src, '')
})

Deno.test('shebang hook - on_normalized returns unchanged context when first line not shebang', async () => {
  const hook = createShebangHook({})
  const context = createMockContext({ src: '# just a comment\nprint(1)' })

  const result = await hook.on_normalized!(context)
  assertEquals(result.config.command, undefined)
})

Deno.test('shebang hook - on_normalized returns unchanged when shebang is empty', async () => {
  const hook = createShebangHook({})
  const context = createMockContext({ src: '#!\nprint(1)' })

  const result = await hook.on_normalized!(context)
  assertEquals(result.config.command, undefined)
})

Deno.test('shebang hook - priority returns a number', () => {
  const hook = createShebangHook({})
  const priority = hook.priority('normalized')
  assertEquals(typeof priority, 'number')
})
