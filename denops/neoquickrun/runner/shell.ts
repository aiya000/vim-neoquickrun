/**
 * Shell runner - execute commands using :! command
 */

import type { Config, ExecutionContext, ExecutionResult, Runner } from '../types.ts'
import type { Denops } from 'https://deno.land/x/denops_std@v6.5.0/mod.ts'
import { getModuleOption } from '../config.ts'

/**
 * Create shell runner
 */
export const createShellRunner = (config: Config): Runner => {
  return {
    name: 'shell',
    validate: async (_denops: Denops) => {
      // Shell runner is always available
    },
    run: async (
      context: ExecutionContext,
      commands: readonly string[],
      _input: string
    ): Promise<ExecutionResult> => {
      const shellcmd = getModuleOption(
        config,
        'runner',
        'shell',
        'shellcmd',
        Deno.build.os === 'windows' ? 'silent !"%s" & pause' : '!%s'
      )

      // Execute each command
      for (const command of commands) {
        const vimCmd = shellcmd.replace('%s', command)
        await context.denops.cmd(vimCmd)
      }

      // Shell runner cannot capture output
      // Return empty output with success status
      return {
        output: '',
        exitCode: 0,
        success: true,
      }
    },
  }
}
