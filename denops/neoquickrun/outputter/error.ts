/**
 * Error outputter - switch outputter based on exit status
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
 * Create error outputter
 */
export const createErrorOutputter = (config: Config): Outputter => {
  let buffer = ''
  let successOutputter: Outputter | undefined
  let errorOutputter: Outputter | undefined

  return {
    name: 'error',
    validate: async (denops: Denops) => {
      const successTarget = getModuleOption(
        config,
        'outputter',
        'error',
        'success',
        'null'
      )
      const errorTarget = getModuleOption(
        config,
        'outputter',
        'error',
        'error',
        'null'
      )

      // Create outputters
      successOutputter = await getOutputter(successTarget, config)
      errorOutputter = await getOutputter(errorTarget, config)

      // Validate
      await successOutputter.validate(denops)
      await errorOutputter.validate(denops)
    },
    start: async (context: ExecutionContext) => {
      buffer = ''
      // Start both outputters
      if (successOutputter) await successOutputter.start(context)
      if (errorOutputter) await errorOutputter.start(context)
    },
    output: async (_context: ExecutionContext, data: string) => {
      // Buffer all output
      buffer += data
    },
    finish: async (context: ExecutionContext, result: ExecutionResult) => {
      // Choose outputter based on exit status
      const targetOutputter = result.success ? successOutputter : errorOutputter

      if (targetOutputter) {
        await targetOutputter.output(context, buffer)
        await targetOutputter.finish(context, result)
      }
    },
  }
}
