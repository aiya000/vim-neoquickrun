/**
 * Tests for parser.ts
 */

import assert from 'node:assert'
const assertEquals = assert.deepStrictEqual.bind(assert)
import { parseCommandArgs, buildConfigFromArgs } from './parser.ts'

Deno.test('parseCommandArgs - empty string', () => {
  const result = parseCommandArgs('')
  assertEquals(result.options, {})
  assertEquals(result.type, undefined)
  assertEquals(result.input, undefined)
  assertEquals(result.output, undefined)
  assertEquals(result.append, undefined)
})

Deno.test('parseCommandArgs - type argument', () => {
  const result = parseCommandArgs('python')
  assertEquals(result.type, 'python')
  assertEquals(result.options, {})
})

Deno.test('parseCommandArgs - single option with value', () => {
  const result = parseCommandArgs('-type python')
  assertEquals(result.options['type'], 'python')
})

Deno.test('parseCommandArgs - multiple options', () => {
  const result = parseCommandArgs('-type python -args foo')
  assertEquals(result.options['type'], 'python')
  assertEquals(result.options['args'], 'foo')
})

Deno.test('parseCommandArgs - boolean option (true)', () => {
  const result = parseCommandArgs('-verbose true')
  assertEquals(result.options['verbose'], true)
})

Deno.test('parseCommandArgs - boolean option (false)', () => {
  const result = parseCommandArgs('-verbose false')
  assertEquals(result.options['verbose'], false)
})

Deno.test('parseCommandArgs - numeric option', () => {
  const result = parseCommandArgs('-timeout 30')
  assertEquals(result.options['timeout'], 30)
})

Deno.test('parseCommandArgs - flag option (no value)', () => {
  const result = parseCommandArgs('-verbose -type python')
  assertEquals(result.options['verbose'], true)
  assertEquals(result.options['type'], 'python')
})

Deno.test('parseCommandArgs - input redirection', () => {
  const result = parseCommandArgs('<inputfile.txt')
  assertEquals(result.input, 'inputfile.txt')
})

Deno.test('parseCommandArgs - output redirection', () => {
  const result = parseCommandArgs('>buffer')
  assertEquals(result.output, 'buffer')
  assertEquals(result.append, false)
})

Deno.test('parseCommandArgs - append output redirection', () => {
  const result = parseCommandArgs('>>buffer')
  assertEquals(result.output, 'buffer')
  assertEquals(result.append, true)
})

Deno.test('parseCommandArgs - quoted string option', () => {
  const result = parseCommandArgs('-src "hello world"')
  assertEquals(result.options['src'], 'hello world')
})

Deno.test('parseCommandArgs - single-quoted string option', () => {
  const result = parseCommandArgs("-src 'hello world'")
  assertEquals(result.options['src'], 'hello world')
})

Deno.test('parseCommandArgs - comma-separated array value', () => {
  const result = parseCommandArgs('-hooks shebang,time')
  assertEquals(result.options['hooks'], ['shebang', 'time'])
})

Deno.test('parseCommandArgs - -src option', () => {
  const result = parseCommandArgs('-src "print(1)"')
  assertEquals(result.options['src'], 'print(1)')
})

Deno.test('parseCommandArgs - complex args', () => {
  const result = parseCommandArgs('-type python -args "arg1 arg2" <input.txt')
  assertEquals(result.options['type'], 'python')
  assertEquals(result.options['args'], 'arg1 arg2')
  assertEquals(result.input, 'input.txt')
})

Deno.test('buildConfigFromArgs - empty args', () => {
  const args = parseCommandArgs('')
  const config = buildConfigFromArgs(args)
  assertEquals(config, {})
})

Deno.test('buildConfigFromArgs - type from options', () => {
  const args = parseCommandArgs('-type python')
  const config = buildConfigFromArgs(args)
  assertEquals(config.type, 'python')
})

Deno.test('buildConfigFromArgs - type from positional', () => {
  const args = parseCommandArgs('python')
  const config = buildConfigFromArgs(args)
  assertEquals(config.type, 'python')
})

Deno.test('buildConfigFromArgs - input becomes config.input', () => {
  const args = parseCommandArgs('<input.txt')
  const config = buildConfigFromArgs(args)
  assertEquals(config.input, 'input.txt')
})

Deno.test('buildConfigFromArgs - output becomes config.outputter', () => {
  const args = parseCommandArgs('>buffer')
  const config = buildConfigFromArgs(args)
  assertEquals(config.outputter, 'buffer')
  assertEquals(config['outputter/append'], false)
})

Deno.test('buildConfigFromArgs - append output', () => {
  const args = parseCommandArgs('>>buffer')
  const config = buildConfigFromArgs(args)
  assertEquals(config.outputter, 'buffer')
  assertEquals(config['outputter/append'], true)
})

Deno.test('buildConfigFromArgs - all options merged into config', () => {
  const args = parseCommandArgs('-type python -runner system -outputter null')
  const config = buildConfigFromArgs(args)
  assertEquals(config.type, 'python')
  assertEquals(config['runner'], 'system')
  assertEquals(config['outputter'], 'null')
})
