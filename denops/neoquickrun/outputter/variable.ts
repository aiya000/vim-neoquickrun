/**
 * Variable outputter - output to a Vim variable
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
 * Create variable outputter
 */
export const createVariableOutputter = (config: Config): Outputter => {
  let buffer = ''

  return {
    name: 'variable',
    validate: async (_denops: Denops) => {
      const varname = getModuleOption(
        config,
        'outputter',
        'variable',
        'name',
        ''
      )
      if (!varname) {
        throw new Error('outputter/variable/name is required')
      }
    },
    start: async (_context: ExecutionContext) => {
      buffer = ''
    },
    output: async (_context: ExecutionContext, data: string) => {
      buffer += data
    },
    finish: async (context: ExecutionContext, _result: ExecutionResult) => {
      const varname = getModuleOption(
        config,
        'outputter',
        'variable',
        'name',
        ''
      )
      const append = getModuleOption(
        config,
        'outputter',
        'variable',
        'append',
        0
      )

      if (append) {
        // Append to existing variable
        const existing = (await context.denops.eval(
          `get(${varname}, '', '')`
        )) as string
        await context.denops.cmd(`let ${varname} = '${escapeString(existing + buffer)}'`)
      } else {
        // Set variable
        await context.denops.cmd(`let ${varname} = '${escapeString(buffer)}'`)
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
