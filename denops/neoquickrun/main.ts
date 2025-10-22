/**
 * vim-neoquickrun - Denops entrypoint
 * Execute commands quickly and show results
 */

import type { Denops } from 'https://deno.land/x/denops_std@v6.5.0/mod.ts'
import * as v from 'https://deno.land/x/denops_std@v6.5.0/variable/mod.ts'
import { parseCommandArgs, buildConfigFromArgs } from './parser.ts'
import { resolveConfig, buildCommands } from './config.ts'
import {
  createContext,
  createSession,
  executeSession,
  invokeHooks,
} from './session.ts'
import { initializeRunners } from './runner/mod.ts'
import { getRunner } from './runner/types.ts'
import { initializeOutputters } from './outputter/mod.ts'
import { getOutputter } from './outputter/types.ts'
import { initializeHooks } from './hook/mod.ts'
import { getHooksFromConfig } from './hook/types.ts'

/**
 * Main entrypoint for denops
 */
export const main = (denops: Denops): void => {
  // Initialize modules
  initializeRunners()
  initializeOutputters()
  initializeHooks()

  // Register API
  denops.dispatcher = {
    /**
     * Run quickrun with given arguments
     */
    run: async (args: unknown): Promise<void> => {
      try {
        // Parse arguments
        const argsStr = typeof args === 'string' ? args : ''
        const commandArgs = parseCommandArgs(argsStr)
        const commandConfig = buildConfigFromArgs(commandArgs)

        // Resolve full configuration
        const config = await resolveConfig(denops, commandConfig)

        // Get source code
        const src = await getSource(denops, config)

        // Create temp file if needed
        const srcfile = await createTempFile(src)

        // Create execution context
        let context = createContext(denops, config, src, srcfile)

        // Get runner, outputter, and hooks
        const runnerName = config.runner || 'job'
        const outputterName = config.outputter || 'buffer'

        const runner = await getRunner(runnerName, config)
        const outputter = await getOutputter(outputterName, config)
        const hooks = await getHooksFromConfig(config)

        // Validate runner and outputter
        await runner.validate(denops)
        await outputter.validate(denops)

        // Create session
        let session = createSession(context, runner, outputter, hooks)

        // Invoke normalized hooks
        session = await invokeHooks(session, 'normalized')

        // Update context
        context = session.context

        // Build commands
        const commands = buildCommands(context.config, context.srcfile)

        // Get input
        const input = await getInput(denops, config)

        // Execute session
        await executeSession(session, commands, input)
      } catch (error) {
        await denops.cmd(`echohl ErrorMsg`)
        await denops.cmd(
          `echomsg 'NeoQuickRun: ${escapeString(String(error))}'`
        )
        await denops.cmd(`echohl None`)
      }
    },
  }
}

/**
 * Get source code to execute
 */
const getSource = async (denops: Denops, config: Record<string, unknown>): Promise<string> => {
  // If src is specified in config, use it
  if (config.src && typeof config.src === 'string') {
    return config.src
  }

  // If srcfile is specified, read from file
  if (config.srcfile && typeof config.srcfile === 'string') {
    return await Deno.readTextFile(config.srcfile)
  }

  // Get from buffer
  const lines = (await denops.call('getline', 1, '$')) as string[]
  return lines.join('\n')
}

/**
 * Create temporary file for source code
 */
const createTempFile = async (src: string): Promise<string> => {
  const tempDir = await Deno.makeTempDir()
  const tempFile = `${tempDir}/neoquickrun_${Date.now()}.tmp`
  await Deno.writeTextFile(tempFile, src)
  return tempFile
}

/**
 * Get input for command
 */
const getInput = async (
  denops: Denops,
  config: Record<string, unknown>
): Promise<string> => {
  const input = config.input

  if (!input || typeof input !== 'string') {
    return ''
  }

  // If input starts with =, treat rest as literal input
  if (input.startsWith('=')) {
    return input.slice(1)
  }

  // If input starts with @, read from register
  if (input.startsWith('@')) {
    const regName = input.slice(1)
    return (await denops.call('getreg', regName)) as string
  }

  // Otherwise, read from file
  try {
    return await Deno.readTextFile(input)
  } catch (_error) {
    return ''
  }
}

/**
 * Escape string for Vim
 */
const escapeString = (str: string): string => {
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\')
}
