import { assertEquals } from 'jsr:@std/assert'
import { createLuaRunner } from './lua.ts'

Deno.test('createLuaRunner - name is lua', () => {
  const runner = createLuaRunner({})
  assertEquals(runner.name, 'lua')
})
