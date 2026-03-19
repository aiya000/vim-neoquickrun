/**
 * Runner module exports and initialization
 */

import type { Config } from '../types.ts'
import { registerRunner } from './types.ts'
import { createDenoRunner } from './deno.ts'
import { createSystemRunner } from './system.ts'
import { createJobRunner } from './job.ts'
import { createTerminalRunner } from './terminal.ts'
import { createShellRunner } from './shell.ts'
import { createRemoteRunner } from './remote.ts'
import { createVimscriptRunner } from './vimscript.ts'

/**
 * Initialize all runners
 */
export const initializeRunners = (): void => {
  registerRunner('deno', async (config: Config) => createDenoRunner(config))
  registerRunner('system', async (config: Config) =>
    createSystemRunner(config)
  )
  registerRunner('job', async (config: Config) => createJobRunner(config))
  registerRunner('terminal', async (config: Config) =>
    createTerminalRunner(config)
  )
  registerRunner('shell', async (config: Config) => createShellRunner(config))
  registerRunner('remote', async (config: Config) =>
    createRemoteRunner(config)
  )
  registerRunner('vimscript', async (config: Config) =>
    createVimscriptRunner(config)
  )
}

// Re-export
export { getRunner, registerRunner } from './types.ts'
export type { RunnerFactory } from './types.ts'
