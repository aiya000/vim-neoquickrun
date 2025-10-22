/**
 * Quickfix outputter - output to quickfix window
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
 * Create quickfix outputter
 */
export const createQuickfixOutputter = (config: Config): Outputter => {
  let buffer = ''

  return {
    name: 'quickfix',
    validate: async (_denops: Denops) => {
      // Quickfix is always available
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
        'quickfix',
        'errorformat',
        '&errorformat'
      )
      const openCmd = getModuleOption(
        config,
        'outputter',
        'quickfix',
        'open_cmd',
        'copen'
      )
      const into = getModuleOption(config, 'outputter', 'quickfix', 'into', 0)

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

        // Parse output and set to quickfix
        const lines = buffer.split('\n')
        await context.denops.call('setqflist', [], ' ', {
          lines: lines,
          efm: efm,
        })

        // Open quickfix window if not empty
        const qflist = (await context.denops.call('getqflist')) as unknown[]
        if (qflist.length > 0) {
          await context.denops.cmd(openCmd)

          // Move cursor to quickfix window if into is set
          if (into) {
            await context.denops.cmd('wincmd p')
          }
        } else {
          // Close quickfix window if empty
          await context.denops.cmd('cclose')
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
