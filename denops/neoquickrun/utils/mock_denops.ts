/**
 * Mock Denops for testing
 */

import type { Denops } from 'https://deno.land/x/denops_std@v6.5.0/mod.ts'

type CallHandler = (fn: string, ...args: unknown[]) => Promise<unknown>
type EvalHandler = (expr: string) => Promise<unknown>
type CmdHandler = (cmd: string) => Promise<void>

export type MockDenopsOptions = {
  callHandler?: CallHandler
  evalHandler?: EvalHandler
  cmdHandler?: CmdHandler
}

/**
 * Create a minimal mock Denops instance for testing
 */
export const createMockDenops = (options: MockDenopsOptions = {}): Denops => {
  const calls: Array<{ fn: string; args: unknown[] }> = []
  const cmds: string[] = []

  return {
    name: 'neoquickrun',
    meta: {
      mode: 'release',
      host: 'vim',
      version: '9.0.0',
      platform: 'linux',
    },
    context: {},
    interrupted: undefined,
    call: async (fn: string, ...args: unknown[]) => {
      calls.push({ fn, args })
      if (options.callHandler) {
        return await options.callHandler(fn, ...args)
      }
      return undefined
    },
    batch: async (..._calls: unknown[]) => {
      return []
    },
    cmd: async (cmd: string, _ctx?: unknown) => {
      cmds.push(cmd)
      if (options.cmdHandler) {
        return await options.cmdHandler(cmd)
      }
    },
    eval: async (expr: string, _ctx?: unknown) => {
      if (options.evalHandler) {
        return await options.evalHandler(expr)
      }
      return undefined
    },
    dispatch: async (_name: string, _fn: string, ..._args: unknown[]) => {
      return undefined
    },
    redraw: async (_force?: boolean) => {},
  } as unknown as Denops
}

/**
 * Create an execution context mock for testing
 */
export const createMockContext = (
  overrides: Partial<{
    src: string
    srcfile: string
    config: Record<string, unknown>
  }> = {}
) => {
  const denops = createMockDenops()
  return {
    denops,
    config: overrides.config ?? {},
    src: overrides.src ?? '',
    srcfile: overrides.srcfile ?? '/tmp/test.tmp',
    tempfiles: [] as string[],
    startTime: Date.now(),
  }
}
