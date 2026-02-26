/**
 * Tests for session.ts
 */

import assert from 'node:assert'
const assertEquals = assert.deepStrictEqual.bind(assert)
const assertNotEquals = assert.notDeepStrictEqual.bind(assert)
import {
  createContext,
  addTempfile,
  createSession,
  updateContext,
  updateConfig,
} from './session.ts'
import { createMockDenops } from './utils/mock_denops.ts'
import type { Runner, Outputter, ExecutionResult } from './types.ts'

const createMockRunner = (): Runner => ({
  name: 'mock',
  validate: async (_denops) => {},
  run: async (_context, _commands, _input): Promise<ExecutionResult> => ({
    output: '',
    exitCode: 0,
    success: true,
  }),
})

const createMockOutputter = (): Outputter => ({
  name: 'mock',
  validate: async (_denops) => {},
  start: async (_context) => {},
  output: async (_context, _data) => {},
  finish: async (_context, _result) => {},
})

Deno.test('createContext - creates context with correct fields', () => {
  const denops = createMockDenops()
  const config = { type: 'python' }
  const context = createContext(denops, config, 'print(1)', '/tmp/test.py')

  assertEquals(context.denops, denops)
  assertEquals(context.config, config)
  assertEquals(context.src, 'print(1)')
  assertEquals(context.srcfile, '/tmp/test.py')
  assertEquals(context.tempfiles, [])
})

Deno.test('createContext - sets startTime close to now', () => {
  const denops = createMockDenops()
  const before = Date.now()
  const context = createContext(denops, {}, '', '')
  const after = Date.now()

  assertEquals(context.startTime >= before, true)
  assertEquals(context.startTime <= after, true)
})

Deno.test('addTempfile - adds file to tempfiles', () => {
  const denops = createMockDenops()
  const context = createContext(denops, {}, '', '')
  const newContext = addTempfile(context, '/tmp/added.tmp')

  assertEquals(newContext.tempfiles, ['/tmp/added.tmp'])
})

Deno.test('addTempfile - original context is not mutated', () => {
  const denops = createMockDenops()
  const context = createContext(denops, {}, '', '')
  addTempfile(context, '/tmp/added.tmp')

  assertEquals(context.tempfiles, [])
})

Deno.test('addTempfile - can add multiple files', () => {
  const denops = createMockDenops()
  const context = createContext(denops, {}, '', '')
  const ctx1 = addTempfile(context, '/tmp/a.tmp')
  const ctx2 = addTempfile(ctx1, '/tmp/b.tmp')

  assertEquals(ctx2.tempfiles, ['/tmp/a.tmp', '/tmp/b.tmp'])
})

Deno.test('createSession - creates session with unique id', () => {
  const denops = createMockDenops()
  const context = createContext(denops, {}, '', '')
  const runner = createMockRunner()
  const outputter = createMockOutputter()

  const session1 = createSession(context, runner, outputter, [])
  const session2 = createSession(context, runner, outputter, [])

  assertNotEquals(session1.id, session2.id)
})

Deno.test('createSession - assigns runner and outputter', () => {
  const denops = createMockDenops()
  const context = createContext(denops, {}, '', '')
  const runner = createMockRunner()
  const outputter = createMockOutputter()

  const session = createSession(context, runner, outputter, [])

  assertEquals(session.runner, runner)
  assertEquals(session.outputter, outputter)
  assertEquals(session.context, context)
  assertEquals(session.hooks, [])
})

Deno.test('updateContext - updates context via function', () => {
  const denops = createMockDenops()
  const context = createContext(denops, {}, 'original src', '/tmp/file.ts')
  const runner = createMockRunner()
  const outputter = createMockOutputter()
  const session = createSession(context, runner, outputter, [])

  const updatedSession = updateContext(session, (ctx) => ({
    ...ctx,
    src: 'updated src',
  }))

  assertEquals(updatedSession.context.src, 'updated src')
  assertEquals(session.context.src, 'original src')
})

Deno.test('updateConfig - updates config via function', () => {
  const denops = createMockDenops()
  const context = createContext(denops, { type: 'python' }, '', '')
  const runner = createMockRunner()
  const outputter = createMockOutputter()
  const session = createSession(context, runner, outputter, [])

  const updatedSession = updateConfig(session, (cfg) => ({
    ...cfg,
    type: 'ruby',
  }))

  assertEquals(updatedSession.context.config.type, 'ruby')
  assertEquals(session.context.config.type, 'python')
})
