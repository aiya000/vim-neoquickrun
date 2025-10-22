/**
 * Shebang hook - extract command from shebang line
 */

import type { ExecutionContext, Hook, HookPoint } from '../types.ts'

/**
 * Create shebang hook
 */
export const createShebangHook = (_config: Record<string, unknown>): Hook => {
  return {
    name: 'shebang',
    priority: (_point: HookPoint) => 0,
    on_normalized: async (context: ExecutionContext) => {
      const lines = context.src.split('\n')
      if (lines.length === 0 || !lines[0]) {
        return context
      }

      const firstLine = lines[0]

      // Check if first line is shebang
      if (!firstLine.startsWith('#!')) {
        return context
      }

      // Extract command from shebang
      const shebangCommand = firstLine.slice(2).trim()

      if (!shebangCommand) {
        return context
      }

      // Update config with shebang command
      return {
        ...context,
        config: {
          ...context.config,
          command: shebangCommand,
          // Convert %c to %C in exec to use literal command
          exec: (context.config.exec as string)?.replace(/%c/g, '%C'),
        },
      }
    },
  }
}
