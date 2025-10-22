/**
 * Output encode hook - convert output encoding
 */

import type {
  ExecutionContext,
  ExecutionResult,
  Hook,
  HookPoint,
} from '../types.ts'
import { getModuleOption } from '../config.ts'

/**
 * Create output_encode hook
 */
export const createOutputEncodeHook = (
  config: Record<string, unknown>
): Hook => {
  return {
    name: 'output_encode',
    priority: (_point: HookPoint) => 0,
    on_output: async (
      context: ExecutionContext,
      data: string
    ): Promise<readonly [ExecutionContext, string]> => {
      const encoding = getModuleOption(
        config,
        'hook',
        'output_encode',
        'encoding',
        ''
      ) as string
      const fileformat = getModuleOption(
        config,
        'hook',
        'output_encode',
        'fileformat',
        ''
      ) as string

      let processed = data

      // Convert encoding (simplified - Deno uses UTF-8 internally)
      if (encoding) {
        const [from, to] = encoding.split(':')
        // Note: Full encoding conversion would require TextDecoder/TextEncoder
        // This is a simplified version
      }

      // Convert line endings
      if (fileformat) {
        switch (fileformat) {
          case 'unix':
            processed = processed.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
            break
          case 'dos':
            processed = processed.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n')
            break
          case 'mac':
            processed = processed.replace(/\r\n/g, '\n').replace(/\n/g, '\r')
            break
        }
      }

      return [context, processed] as const
    },
  }
}
