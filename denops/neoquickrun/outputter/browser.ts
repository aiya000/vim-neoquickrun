/**
 * Browser outputter - open output in browser
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
 * Create browser outputter
 */
export const createBrowserOutputter = (config: Config): Outputter => {
  let buffer = ''
  let outputFile = ''

  return {
    name: 'browser',
    validate: async (_denops: Denops) => {
      // Browser outputter is always available
    },
    start: async (_context: ExecutionContext) => {
      buffer = ''

      // Get or generate output file path
      const name = getModuleOption(
        config,
        'outputter',
        'browser',
        'name',
        ''
      )

      if (name) {
        outputFile = name
      } else {
        // Generate temporary file
        const tempDir = await Deno.makeTempDir()
        outputFile = `${tempDir}/output.html`
      }
    },
    output: async (_context: ExecutionContext, data: string) => {
      buffer += data
    },
    finish: async (_context: ExecutionContext, _result: ExecutionResult) => {
      const append = getModuleOption(
        config,
        'outputter',
        'browser',
        'append',
        0
      )

      // Write to file
      if (append) {
        await Deno.writeTextFile(outputFile, buffer, { append: true })
      } else {
        await Deno.writeTextFile(outputFile, buffer)
      }

      // Open in browser
      await openBrowser(outputFile)
    },
  }
}

/**
 * Open file in browser
 */
const openBrowser = async (filepath: string): Promise<void> => {
  const os = Deno.build.os

  let command: string
  let args: string[]

  switch (os) {
    case 'darwin':
      command = 'open'
      args = [filepath]
      break
    case 'windows':
      command = 'cmd'
      args = ['/c', 'start', filepath]
      break
    default: // linux and others
      command = 'xdg-open'
      args = [filepath]
      break
  }

  const cmd = new Deno.Command(command, { args })
  await cmd.output()
}
