/**
 * Message outputter - output to message area
 */

import type {
  Config,
  ExecutionContext,
  ExecutionResult,
  Outputter,
} from '../types.ts'
import type { Denops } from 'https://deno.land/x/denops_std@v6.5.0/mod.ts'
import { getModuleOption } from '../config.ts'

/**
 * Create message outputter
 */
export const createMessageOutputter = (config: Config): Outputter => {
  let buffer = ''

  return {
    name: 'message',
    validate: async (_denops: Denops) => {
      // Message outputter is always available
    },
    start: async (_context: ExecutionContext) => {
      buffer = ''
    },
    output: async (_context: ExecutionContext, data: string) => {
      buffer += data
    },
    finish: async (context: ExecutionContext, _result: ExecutionResult) => {
      const log = getModuleOption(config, 'outputter', 'message', 'log', 0)

      if (log) {
        // Output to message history
        const lines = buffer.split('\n')
        for (const line of lines) {
          if (line) {
            await context.denops.cmd(`echomsg '${escapeString(line)}'`)
          }
        }
      } else {
        // Output with echo (not saved to history)
        const lines = buffer.split('\n')
        for (const line of lines) {
          if (line) {
            await context.denops.cmd(`echo '${escapeString(line)}'`)
          }
        }
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
