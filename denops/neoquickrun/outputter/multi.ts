/**
 * Multi outputter - output to multiple outputters
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
 * Create multi outputter
 */
export const createMultiOutputter = (config: Config): Outputter => {
  let outputters: Outputter[] = []

  return {
    name: 'multi',
    validate: async (denops: Denops) => {
      const targets = getModuleOption(
        config,
        'outputter',
        'multi',
        'targets',
        [] as string[]
      )
      if (!Array.isArray(targets) || targets.length === 0) {
        throw new Error('outputter/multi/targets must be a non-empty array')
      }

      // Create all target outputters
      outputters = await Promise.all(
        targets.map((target) => getOutputter(target, config))
      )

      // Validate all outputters
      await Promise.all(outputters.map((out) => out.validate(denops)))
    },
    start: async (context: ExecutionContext) => {
      await Promise.all(outputters.map((out) => out.start(context)))
    },
    output: async (context: ExecutionContext, data: string) => {
      await Promise.all(outputters.map((out) => out.output(context, data)))
    },
    finish: async (context: ExecutionContext, result: ExecutionResult) => {
      await Promise.all(outputters.map((out) => out.finish(context, result)))
    },
  }
}
