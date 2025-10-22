/**
 * Location list outputter - output to location list window
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
 * Create loclist outputter
 */
export const createLoclistOutputter = (config: Config): Outputter => {
  let buffer = ''

  return {
    name: 'loclist',
    validate: async (_denops: Denops) => {
      // Location list is always available
    },
    start: async (_context: ExecutionContext) => {
      buffer = ''
    },
    output: async (_context: ExecutionContext, data: string) => {
      buffer += data
    },
    finish: async (context: ExecutionContext, _result: ExecutionResult) => {
      const errorformat = getModuleOption(
        config,
        'outputter',
        'loclist',
        'errorformat',
        '&errorformat'
      )
      const openCmd = getModuleOption(
        config,
        'outputter',
        'loclist',
        'open_cmd',
        'lopen'
      )
      const into = getModuleOption(config, 'outputter', 'loclist', 'into', 0)

      // Expand errorformat if it starts with &
      let efm = errorformat
      if (errorformat.startsWith('&')) {
        efm = (await context.denops.eval(errorformat)) as string
      }

      // Save current errorformat
      const savedEfm = await context.denops.eval('&errorformat')

      try {
        // Set errorformat
        await context.denops.cmd(`set errorformat=${escapeForSet(efm)}`)

        // Parse output and set to location list
        const lines = buffer.split('\n')
        await context.denops.call('setloclist', 0, [], ' ', {
          lines: lines,
          efm: efm,
        })

        // Open location list window if not empty
        const loclist = (await context.denops.call('getloclist', 0)) as unknown[]
        if (loclist.length > 0) {
          await context.denops.cmd(openCmd)

          // Move cursor to loclist window if into is set
          if (into) {
            await context.denops.cmd('wincmd p')
          }
        } else {
          // Close location list window if empty
          await context.denops.cmd('lclose')
        }
      } finally {
        // Restore errorformat
        await context.denops.cmd(
          `set errorformat=${escapeForSet(savedEfm as string)}`
        )
      }
    },
  }
}

/**
 * Escape string for :set command
 */
const escapeForSet = (str: string): string => {
  return str.replace(/ /g, '\\ ').replace(/"/g, '\\"')
}
