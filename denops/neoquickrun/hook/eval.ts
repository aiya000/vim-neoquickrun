/**
 * Eval hook - wrap source with template
 */

import type { ExecutionContext, Hook, HookPoint } from '../types.ts'
import { getModuleOption } from '../config.ts'

/**
 * Create eval hook
 */
export const createEvalHook = (config: Record<string, unknown>): Hook => {
  return {
    name: 'eval',
    priority: (_point: HookPoint) => 0,
    on_normalized: async (context: ExecutionContext) => {
      const template = getModuleOption(
        config,
        'hook',
        'eval',
        'template',
        ''
      ) as string

      if (!template) {
        return context
      }

      // Replace %s with source
      const wrappedSrc = template.replace(/%s/g, context.src)

      return {
        ...context,
        src: wrappedSrc,
      }
    },
  }
}
