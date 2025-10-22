/**
 * CD hook - change directory before execution
 */

import type { ExecutionContext, Hook, HookPoint } from '../types.ts'
import { getModuleOption } from '../config.ts'

/**
 * Create cd hook
 */
export const createCdHook = (config: Record<string, unknown>): Hook => {
  let originalCwd = ''

  return {
    name: 'cd',
    priority: (_point: HookPoint) => 0,
    on_normalized: async (context: ExecutionContext) => {
      const directory = getModuleOption(
        config,
        'hook',
        'cd',
        'directory',
        ''
      ) as string

      if (!directory) {
        return context
      }

      // Save current directory
      originalCwd = (await context.denops.call('getcwd')) as string

      // Change directory
      await context.denops.cmd(`cd ${directory}`)

      return context
    },
    on_exit: async (context: ExecutionContext) => {
      // Restore original directory
      if (originalCwd) {
        await context.denops.cmd(`cd ${originalCwd}`)
      }
    },
  }
}
