/**
 * Null outputter - discard all output
 */

import type {
  Config,
  ExecutionContext,
  ExecutionResult,
  Outputter,
} from '../types.ts'
import type { Denops } from 'https://deno.land/x/denops_std@v6.5.0/mod.ts'

/**
 * Create null outputter
 */
export const createNullOutputter = (_config: Config): Outputter => {
  return {
    name: 'null',
    validate: async (_denops: Denops) => {
      // Null outputter is always available
    },
    start: async (_context: ExecutionContext) => {
      // Do nothing
    },
    output: async (_context: ExecutionContext, _data: string) => {
      // Discard output
    },
    finish: async (_context: ExecutionContext, _result: ExecutionResult) => {
      // Do nothing
    },
  }
}
