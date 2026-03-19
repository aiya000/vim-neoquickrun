/**
 * Lua runner - execute Lua code using Neovim's nvim_exec2
 */

import type { Config, ExecutionContext, ExecutionResult, Runner } from '../types.ts'
import type { Denops } from 'https://deno.land/x/denops_std@v6.5.0/mod.ts'

/**
 * Create lua runner
 */
export const createLuaRunner = (_config: Config): Runner => {
  return {
    name: 'lua',
    validate: async (denops: Denops) => {
      const hasNvim = await denops.call('has', 'nvim')
      if (!hasNvim) {
        throw new Error('Lua runner requires Neovim')
      }
    },
    run: async (
      context: ExecutionContext,
      commands: readonly string[],
      _input: string
    ): Promise<ExecutionResult> => {
      let output = ''
      let exitCode = 0

      for (const command of commands) {
        const result = await executeLua(context.denops, command)
        output += result.output
        exitCode = result.exitCode

        // If command fails, stop execution
        if (exitCode !== 0) {
          break
        }
      }

      return {
        output,
        exitCode,
        success: exitCode === 0,
      }
    },
  }
}

/**
 * Execute Lua code using nvim_exec2
 */
const executeLua = async (
  denops: Denops,
  command: string
): Promise<{ output: string; exitCode: number }> => {
  try {
    const result = (await denops.call('nvim_exec2', command, {
      output: true,
    })) as { output?: string }
    const output = result.output ?? ''
    return { output, exitCode: 0 }
  } catch (error) {
    return {
      output: `Error executing Lua: ${error}`,
      exitCode: 1,
    }
  }
}
