/**
 * Tests for hook/sweep.ts
 */

import assert from 'node:assert'
const assertEquals = assert.deepStrictEqual.bind(assert)
import { createSweepHook } from './sweep.ts'
import { createMockContext } from '../utils/mock_denops.ts'

const makeResult = () => ({
  output: '',
  exitCode: 0,
  success: true,
})

Deno.test('sweep hook - has correct name', () => {
  const hook = createSweepHook({})
  assertEquals(hook.name, 'sweep')
})

Deno.test('sweep hook - priority returns a number', () => {
  const hook = createSweepHook({})
  assertEquals(typeof hook.priority('exit'), 'number')
})

Deno.test('sweep hook - removes files listed in hook/sweep/files', async () => {
  const tmpFile = await Deno.makeTempFile()
  const hook = createSweepHook({ 'hook/sweep/files': tmpFile })
  const context = createMockContext()

  await hook.on_exit!(context, makeResult())

  let exists = true
  try {
    await Deno.stat(tmpFile)
  } catch {
    exists = false
  }
  assertEquals(exists, false)
})

Deno.test('sweep hook - removes array of files', async () => {
  const tmpFile1 = await Deno.makeTempFile()
  const tmpFile2 = await Deno.makeTempFile()
  const hook = createSweepHook({ 'hook/sweep/files': [tmpFile1, tmpFile2] })
  const context = createMockContext()

  await hook.on_exit!(context, makeResult())

  for (const f of [tmpFile1, tmpFile2]) {
    let exists = true
    try {
      await Deno.stat(f)
    } catch {
      exists = false
    }
    assertEquals(exists, false)
  }
})

Deno.test('sweep hook - does not throw when file does not exist', async () => {
  const hook = createSweepHook({ 'hook/sweep/files': '/tmp/nonexistent_neoquickrun_test.tmp' })
  const context = createMockContext()

  // Should not throw
  await hook.on_exit!(context, makeResult())
})

Deno.test('sweep hook - does nothing when no files configured', async () => {
  const hook = createSweepHook({})
  const context = createMockContext()

  // Should not throw
  await hook.on_exit!(context, makeResult())
})
