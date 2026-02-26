/**
 * Tests for config.ts (pure functions only)
 */

import assert from 'node:assert'
const assertEquals = assert.deepStrictEqual.bind(assert)
import {
  DEFAULT_CONFIG,
  expandExecFormat,
  buildCommands,
  getModuleOption,
} from './config.ts'

Deno.test('DEFAULT_CONFIG - has expected defaults', () => {
  assertEquals(DEFAULT_CONFIG.outputter, 'buffer')
  assertEquals(DEFAULT_CONFIG.runner, 'job')
  assertEquals(DEFAULT_CONFIG.cmdopt, '')
  assertEquals(DEFAULT_CONFIG.args, '')
  assertEquals(DEFAULT_CONFIG.exec, '%c %o %s %a')
})

Deno.test('expandExecFormat - expands %c with command', () => {
  const result = expandExecFormat('%c', { command: 'python' }, '/tmp/file.py')
  assertEquals(result, 'python')
})

Deno.test('expandExecFormat - expands %c with type if command missing', () => {
  const result = expandExecFormat('%c', { type: 'ruby' }, '/tmp/file.rb')
  assertEquals(result, 'ruby')
})

Deno.test('expandExecFormat - expands %o with cmdopt', () => {
  const result = expandExecFormat('%o', { cmdopt: '-W0' }, '/tmp/file.rb')
  assertEquals(result, '-W0')
})

Deno.test('expandExecFormat - expands %o as empty when cmdopt missing', () => {
  const result = expandExecFormat('%o', {}, '/tmp/file.rb')
  assertEquals(result, '')
})

Deno.test('expandExecFormat - expands %s with escaped srcfile', () => {
  const result = expandExecFormat('%s', {}, '/tmp/my file.py')
  // On non-Windows, file should be single-quoted
  assertEquals(result, "'/tmp/my file.py'")
})

Deno.test('expandExecFormat - expands %S with unescaped srcfile', () => {
  const result = expandExecFormat('%S', {}, '/tmp/file.py')
  assertEquals(result, '/tmp/file.py')
})

Deno.test('expandExecFormat - expands %a with args', () => {
  const result = expandExecFormat('%a', { args: 'arg1 arg2' }, '/tmp/file.py')
  assertEquals(result, 'arg1 arg2')
})

Deno.test('expandExecFormat - expands %a as empty when args missing', () => {
  const result = expandExecFormat('%a', {}, '/tmp/file.py')
  assertEquals(result, '')
})

Deno.test('expandExecFormat - handles %% as literal %', () => {
  const result = expandExecFormat('100%%', {}, '/tmp/file.py')
  assertEquals(result, '100%')
})

Deno.test('expandExecFormat - full format string', () => {
  const result = expandExecFormat('%c %o %s %a', {
    command: 'python',
    cmdopt: '-u',
    args: 'input.txt',
  }, '/tmp/script.py')
  assertEquals(result, "python -u '/tmp/script.py' input.txt")
})

Deno.test('buildCommands - returns commands from string exec', () => {
  const config = { command: 'python', exec: '%c %s' }
  const result = buildCommands(config, '/tmp/file.py')
  assertEquals(result, ["python '/tmp/file.py'"])
})

Deno.test('buildCommands - returns commands from array exec', () => {
  const config = { command: 'python', exec: ['%c -c "import sys"', '%c %s'] }
  const result = buildCommands(config, '/tmp/file.py')
  assertEquals(result.length, 2)
  assertEquals(result[0], 'python -c "import sys"')
  assertEquals(result[1], "python '/tmp/file.py'")
})

Deno.test('buildCommands - returns empty array when exec is missing', () => {
  const config = {}
  const result = buildCommands(config, '/tmp/file.py')
  assertEquals(result, [])
})

Deno.test('getModuleOption - returns module-specific option (full path)', () => {
  const config = { 'runner/job/pty': 1 }
  const result = getModuleOption(config, 'runner', 'job', 'pty', 0)
  assertEquals(result, 1)
})

Deno.test('getModuleOption - falls back to name/option path', () => {
  const config = { 'job/pty': 1 }
  const result = getModuleOption(config, 'runner', 'job', 'pty', 0)
  assertEquals(result, 1)
})

Deno.test('getModuleOption - falls back to type/option path', () => {
  const config = { 'runner/pty': 1 }
  const result = getModuleOption(config, 'runner', 'job', 'pty', 0)
  assertEquals(result, 1)
})

Deno.test('getModuleOption - falls back to option name only', () => {
  const config = { pty: 1 }
  const result = getModuleOption(config, 'runner', 'job', 'pty', 0)
  assertEquals(result, 1)
})

Deno.test('getModuleOption - returns default when option not found', () => {
  const config = {}
  const result = getModuleOption(config, 'runner', 'job', 'pty', 0)
  assertEquals(result, 0)
})

Deno.test('getModuleOption - most specific path takes precedence', () => {
  const config = { 'runner/job/pty': 2, 'job/pty': 1, 'runner/pty': 3, pty: 4 }
  const result = getModuleOption(config, 'runner', 'job', 'pty', 0)
  assertEquals(result, 2)
})
