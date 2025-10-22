/**
 * File outputter - output to a file
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
 * Create file outputter
 */
export const createFileOutputter = (config: Config): Outputter => {
  let buffer = ''

  return {
    name: 'file',
    validate: async (_denops: Denops) => {
      const filename = getModuleOption(config, 'outputter', 'file', 'name', '')
      if (!filename) {
        throw new Error('outputter/file/name is required')
      }
    },
    start: async (_context: ExecutionContext) => {
      buffer = ''
    },
    output: async (_context: ExecutionContext, data: string) => {
      buffer += data
    },
    finish: async (_context: ExecutionContext, _result: ExecutionResult) => {
      const filename = getModuleOption(config, 'outputter', 'file', 'name', '')
      const append = getModuleOption(config, 'outputter', 'file', 'append', 0)

      if (append) {
        // Append to file
        await Deno.writeTextFile(filename, buffer, { append: true })
      } else {
        // Overwrite file
        await Deno.writeTextFile(filename, buffer)
      }
    },
  }
}
