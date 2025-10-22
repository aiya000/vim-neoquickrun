/**
 * Buffered outputter - buffer all output and pass to target outputter at finish
 */

import type {
  Config,
  ExecutionContext,
  ExecutionResult,
  Outputter,
} from '../types.ts'
import type { Denops } from 'https://deno.land/x/denops_std@v6.5.0/mod.ts'
import { getModuleOption } from '../config.ts'
import { getOutputter } from './types.ts'

/**
 * Create buffered outputter
 */
export const createBufferedOutputter = (config: Config): Outputter => {
  let buffer = ''
  let targetOutputter: Outputter | undefined

  return {
    name: 'buffered',
    validate: async (denops: Denops) => {
      const target = getModuleOption(
        config,
        'outputter',
        'buffered',
        'target',
        ''
      )
      if (!target) {
        throw new Error('outputter/buffered/target is required')
      }

      // Create target outputter
      targetOutputter = await getOutputter(target, config)
      await targetOutputter.validate(denops)
    },
    start: async (context: ExecutionContext) => {
      buffer = ''
      if (targetOutputter) {
        await targetOutputter.start(context)
      }
    },
    output: async (_context: ExecutionContext, data: string) => {
      // Buffer the output
      buffer += data
    },
    finish: async (context: ExecutionContext, result: ExecutionResult) => {
      // Pass all buffered output to target outputter at once
      if (targetOutputter) {
        await targetOutputter.output(context, buffer)
        await targetOutputter.finish(context, result)
      }
    },
  }
}
