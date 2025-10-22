/**
 * Hook module exports and initialization
 */

import type { Config } from '../types.ts'
import { registerHook, getHook } from './types.ts'
import { createCdHook } from './cd.ts'
import { createEvalHook } from './eval.ts'
import { createOutputEncodeHook } from './output_encode.ts'
import { createShebangHook } from './shebang.ts'
import { createSweepHook } from './sweep.ts'
import { createTimeHook } from './time.ts'

/**
 * Initialize all hooks
 */
export const initializeHooks = (): void => {
  registerHook('cd', async (config: Config) => createCdHook(config))
  registerHook('eval', async (config: Config) => createEvalHook(config))
  registerHook('output_encode', async (config: Config) =>
    createOutputEncodeHook(config)
  )
  registerHook('shebang', async (config: Config) => createShebangHook(config))
  registerHook('sweep', async (config: Config) => createSweepHook(config))
  registerHook('time', async (config: Config) => createTimeHook(config))
}

// Re-export
export { getHook, registerHook, getHooksFromConfig } from './types.ts'
export type { HookFactory } from './types.ts'
