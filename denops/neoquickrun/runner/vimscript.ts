/**
 * Vimscript runner - execute commands as Vim script
 */

import type { Config, ExecutionContext, ExecutionResult, Runner } from '../types.ts'
import type { Denops } from 'https://deno.land/x/denops_std@v6.5.0/mod.ts'

/**
 * Create vimscript runner
 */
export const createVimscriptRunner = (_config: Config): Runner => {
  return {
    name: 'vimscript',
    validate: async (_denops: Denops) => {
      // Vimscript runner is always available
    },
    run: async (
      context: ExecutionContext,
      commands: readonly string[],
      _input: string
    ): Promise<ExecutionResult> => {
      let output = ''
      let exitCode = 0

      try {
        // Capture output using :redir
        const callbackName = `NeoQuickRun_Vimscript_${Date.now()}_${Math.random()}`

        // Initialize output variable
        await context.denops.cmd(`let g:${callbackName}_output = ''`)

        // Execute each command with redir
        for (const command of commands) {
          await context.denops.cmd(`redir => g:${callbackName}_output`)
          try {
            await context.denops.cmd('silent! ' + command)
          } catch (error) {
            // Command failed
            exitCode = 1
            output += `Error: ${error}\n`
          }
          await context.denops.cmd('redir END')

          // Get captured output
          const cmdOutput = (await context.denops.eval(
            `g:${callbackName}_output`
          )) as string
          output += cmdOutput

          // Reset output variable
          await context.denops.cmd(`let g:${callbackName}_output = ''`)

          // Stop on error
          if (exitCode !== 0) {
            break
          }
        }

        // Cleanup
        await context.denops.cmd(`unlet g:${callbackName}_output`)
      } catch (error) {
        output += `Error executing Vim script: ${error}\n`
        exitCode = 1
      }

      return {
        output,
        exitCode,
        success: exitCode === 0,
      }
    },
  }
}
