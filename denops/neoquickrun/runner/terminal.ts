/**
 * Terminal runner - execute commands in terminal window
 */

import type { Config, ExecutionContext, ExecutionResult, Runner } from '../types.ts'
import type { Denops } from 'https://deno.land/x/denops_std@v6.5.0/mod.ts'
import { getModuleOption } from '../config.ts'

/**
 * Create terminal runner
 */
export const createTerminalRunner = (config: Config): Runner => {
  return {
    name: 'terminal',
    validate: async (denops: Denops) => {
      const hasTerminal = await denops.call('has', 'terminal')
      if (!hasTerminal) {
        throw new Error('Terminal feature is not available')
      }
    },
    run: async (
      context: ExecutionContext,
      commands: readonly string[],
      input: string
    ): Promise<ExecutionResult> => {
      const opener = getModuleOption(
        config,
        'runner',
        'terminal',
        'opener',
        'new'
      )
      const into = getModuleOption(config, 'runner', 'terminal', 'into', 0)

      // Create temporary script file for commands
      const scriptPath = await createCommandScript(commands, input)

      try {
        // Open terminal
        const termBufnr = await context.denops.call(
          'term_start',
          Deno.build.os === 'windows'
            ? ['cmd', '/c', scriptPath]
            : ['sh', scriptPath],
          {
            term_finish: 'close',
          }
        )

        // Get terminal window
        const termWin = await context.denops.call('bufwinid', termBufnr)

        // Execute opener command if terminal is not visible
        if (termWin === -1) {
          await context.denops.cmd(opener)
          await context.denops.cmd(`buffer ${termBufnr}`)
        }

        // Move cursor to terminal if into option is set
        if (into && termWin !== -1) {
          await context.denops.call('win_gotoid', termWin)
        }

        // Terminal runner cannot capture output
        // Return empty output with success status
        return {
          output: '',
          exitCode: 0,
          success: true,
        }
      } finally {
        // Cleanup script file
        try {
          await Deno.remove(scriptPath)
        } catch (_error) {
          // Ignore cleanup errors
        }
      }
    },
  }
}

/**
 * Create a temporary script file for commands
 */
const createCommandScript = async (
  commands: readonly string[],
  input: string
): Promise<string> => {
  const tempDir = await Deno.makeTempDir()
  const scriptPath =
    Deno.build.os === 'windows'
      ? `${tempDir}\\quickrun.bat`
      : `${tempDir}/quickrun.sh`

  let scriptContent = ''

  if (Deno.build.os === 'windows') {
    scriptContent = '@echo off\n'
    scriptContent += commands.join('\n')
  } else {
    scriptContent = '#!/bin/sh\n'
    scriptContent += commands.join('\n')
  }

  await Deno.writeTextFile(scriptPath, scriptContent)

  if (Deno.build.os !== 'windows') {
    // Make script executable
    await Deno.chmod(scriptPath, 0o755)
  }

  return scriptPath
}
