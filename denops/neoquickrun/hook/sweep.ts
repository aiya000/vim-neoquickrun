/**
 * Sweep hook - remove temporary files
 */

import type {
  ExecutionContext,
  ExecutionResult,
  Hook,
  HookPoint,
} from '../types.ts'
import { getModuleOption } from '../config.ts'
import { expandExecFormat } from '../config.ts'

/**
 * Create sweep hook
 */
export const createSweepHook = (config: Record<string, unknown>): Hook => {
  return {
    name: 'sweep',
    priority: (_point: HookPoint) => 0,
    on_exit: async (context: ExecutionContext, _result: ExecutionResult) => {
      const files = getModuleOption(config, 'hook', 'sweep', 'files', []) as
        | string[]
        | string

      const fileList = Array.isArray(files) ? files : [files]

      for (const file of fileList) {
        if (!file) continue

        // Expand placeholders
        const expanded = expandExecFormat(file, context.config, context.srcfile)

        try {
          await Deno.remove(expanded)
        } catch (_error) {
          // Ignore errors (file may not exist)
        }
      }
    },
  }
}
