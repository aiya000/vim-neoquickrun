/**
 * System runner - execute commands synchronously using Vim's system()
 */

import type { Config, ExecutionContext, ExecutionResult, Runner } from '../types.ts'
import type { Denops } from 'https://deno.land/x/denops_std@v6.5.0/mod.ts'

/**
 * Create system runner
 */
export const createSystemRunner = (_config: Config): Runner => {
  return {
    name: 'system',
    validate: async (_denops: Denops) => {
      // System runner is available on both Vim and Neovim
    },
    run: async (
      context: ExecutionContext,
      commands: readonly string[],
      input: string
    ): Promise<ExecutionResult> => {
      let output = ''
      let exitCode = 0

      for (const command of commands) {
        const result = await executeCommand(context.denops, command, input)
        output += result.output
        exitCode = result.exitCode

        // If command fails, stop execution
        if (exitCode !== 0) {
          break
        }

        // Use output as input for next command
        input = result.output
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
 * Execute a single command using Vim's system()
 */
const executeCommand = async (
  denops: Denops,
  command: string,
  input: string
): Promise<{ output: string; exitCode: number }> => {
  try {
    const output = (await denops.call('system', command, input)) as string
    const exitCode = (await denops.eval('v:shell_error')) as number
    return { output, exitCode }
  } catch (error) {
    return {
      output: `Error executing command: ${error}`,
      exitCode: 1,
    }
  }
}
