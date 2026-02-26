/**
 * Tests for hook/output_encode.ts
 */

import assert from 'node:assert'
const assertEquals = assert.deepStrictEqual.bind(assert)
import { createOutputEncodeHook } from './output_encode.ts'
import { createMockContext } from '../utils/mock_denops.ts'

Deno.test('output_encode hook - has correct name', () => {
  const hook = createOutputEncodeHook({})
  assertEquals(hook.name, 'output_encode')
})

Deno.test('output_encode hook - returns data unchanged when no config', async () => {
  const hook = createOutputEncodeHook({})
  const context = createMockContext()
  const [_ctx, result] = await hook.on_output!(context, 'hello\nworld')
  assertEquals(result, 'hello\nworld')
})

Deno.test('output_encode hook - converts CRLF to LF for unix fileformat', async () => {
  const hook = createOutputEncodeHook({ 'hook/output_encode/fileformat': 'unix' })
  const context = createMockContext()
  const [_ctx, result] = await hook.on_output!(context, 'hello\r\nworld\r\n')
  assertEquals(result, 'hello\nworld\n')
})

Deno.test('output_encode hook - converts CR to LF for unix fileformat', async () => {
  const hook = createOutputEncodeHook({ 'hook/output_encode/fileformat': 'unix' })
  const context = createMockContext()
  const [_ctx, result] = await hook.on_output!(context, 'hello\rworld')
  assertEquals(result, 'hello\nworld')
})

Deno.test('output_encode hook - converts LF to CRLF for dos fileformat', async () => {
  const hook = createOutputEncodeHook({ 'hook/output_encode/fileformat': 'dos' })
  const context = createMockContext()
  const [_ctx, result] = await hook.on_output!(context, 'hello\nworld\n')
  assertEquals(result, 'hello\r\nworld\r\n')
})

Deno.test('output_encode hook - converts LF to CR for mac fileformat', async () => {
  const hook = createOutputEncodeHook({ 'hook/output_encode/fileformat': 'mac' })
  const context = createMockContext()
  const [_ctx, result] = await hook.on_output!(context, 'hello\nworld\n')
  assertEquals(result, 'hello\rworld\r')
})

Deno.test('output_encode hook - returns context unchanged', async () => {
  const hook = createOutputEncodeHook({})
  const context = createMockContext({ src: 'test src' })
  const [resultCtx, _data] = await hook.on_output!(context, 'data')
  assertEquals(resultCtx.src, context.src)
})

Deno.test('output_encode hook - priority returns a number', () => {
  const hook = createOutputEncodeHook({})
  const priority = hook.priority('output')
  assertEquals(typeof priority, 'number')
})
