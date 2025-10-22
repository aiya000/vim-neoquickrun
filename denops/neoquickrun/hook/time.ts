/**
 * Time hook - measure execution time
 */

import type {
  ExecutionContext,
  ExecutionResult,
  Hook,
  HookPoint,
} from '../types.ts'
import { getModuleOption } from '../config.ts'
import { getOutputter } from '../outputter/types.ts'

/**
 * Create time hook
 */
export const createTimeHook = (config: Record<string, unknown>): Hook => {
  let startTime = 0

  return {
    name: 'time',
    priority: (_point: HookPoint) => 0,
    on_ready: async (context: ExecutionContext) => {
      startTime = Date.now()
      return context
    },
    on_finish: async (
      context: ExecutionContext,
      result: ExecutionResult
    ) => {
      const endTime = Date.now()
      const elapsed = (endTime - startTime) / 1000 // seconds

      const format = getModuleOption(
        config,
        'hook',
        'time',
        'format',
        '\n*** time: %g ***'
      ) as string
      const dest = getModuleOption(config, 'hook', 'time', 'dest', '') as string

      // Format time message
      const message = format.replace(/%g/g, elapsed.toFixed(3))

      if (dest) {
        // Output to specific outputter
        try {
          const outputter = await getOutputter(dest, context.config)
          await outputter.start(context)
          await outputter.output(context, message)
          await outputter.finish(context, result)
        } catch (_error) {
          // Fallback to echomsg if outputter fails
          await context.denops.cmd(`echomsg '${escapeString(message)}'`)
        }
      } else {
        // Output to current session's outputter (would need access to session)
        // For now, just echo the message
        await context.denops.cmd(`echomsg '${escapeString(message)}'`)
      }
    },
  }
}

/**
 * Escape string for Vim
 */
const escapeString = (str: string): string => {
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\')
}
