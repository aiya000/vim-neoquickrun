/**
 * Remote runner - execute commands in background using clientserver
 */

import type { Config, ExecutionContext, ExecutionResult, Runner } from '../types.ts'
import type { Denops } from 'https://deno.land/x/denops_std@v6.5.0/mod.ts'

/**
 * Create remote runner
 */
export const createRemoteRunner = (_config: Config): Runner => {
  return {
    name: 'remote',
    validate: async (denops: Denops) => {
      const hasClientserver = await denops.call('has', 'clientserver')
      if (!hasClientserver) {
        throw new Error('Clientserver feature is not available')
      }

      const servername = await denops.call('v:servername')
      if (!servername) {
        throw new Error(
          'Vim server name is not set. Start Vim with --servername option'
        )
      }
    },
    run: async (
      context: ExecutionContext,
      commands: readonly string[],
      input: string
    ): Promise<ExecutionResult> => {
      const servername = (await context.denops.call('v:servername')) as string

      // Create temporary script for remote execution
      const scriptPath = await createRemoteScript(
        servername,
        commands,
        input,
        context.denops
      )

      try {
        // Execute script in background
        if (Deno.build.os === 'windows') {
          await executeWindows(scriptPath)
        } else {
          await executeUnix(scriptPath)
        }

        // Remote runner executes in background
        // Return success immediately
        return {
          output: 'Executed in background',
          exitCode: 0,
          success: true,
        }
      } finally {
        // Cleanup will be done by the script itself
      }
    },
  }
}

/**
 * Create remote execution script
 */
const createRemoteScript = async (
  servername: string,
  commands: readonly string[],
  input: string,
  denops: Denops
): Promise<string> => {
  const tempDir = await Deno.makeTempDir()
  const isWindows = Deno.build.os === 'windows'
  const scriptPath = isWindows
    ? `${tempDir}\\remote.bat`
    : `${tempDir}/remote.sh`

  const outputFile = isWindows
    ? `${tempDir}\\output.txt`
    : `${tempDir}/output.txt`

  let scriptContent = ''

  if (isWindows) {
    scriptContent = '@echo off\n'
    scriptContent += commands.join(' && ') + ` > "${outputFile}" 2>&1\n`
    scriptContent += `vim --servername ${servername} --remote-expr "NeoQuickRunRemoteCallback('${outputFile}')"\n`
    scriptContent += `del "${scriptPath}"\n`
  } else {
    scriptContent = '#!/bin/sh\n'
    scriptContent += `(${commands.join(' && ')}) > "${outputFile}" 2>&1\n`
    scriptContent += `vim --servername ${servername} --remote-expr "NeoQuickRunRemoteCallback('${outputFile}')"\n`
    scriptContent += `rm -f "${scriptPath}"\n`
  }

  await Deno.writeTextFile(scriptPath, scriptContent)

  if (!isWindows) {
    await Deno.chmod(scriptPath, 0o755)
  }

  // Register callback function in Vim
  await denops.cmd(`
    function! NeoQuickRunRemoteCallback(file) abort
      if filereadable(a:file)
        let output = join(readfile(a:file), "\\n")
        call delete(a:file)
        echomsg "Remote execution completed"
        echomsg output
      endif
      return ''
    endfunction
  `)

  return scriptPath
}

/**
 * Execute script on Windows
 */
const executeWindows = async (scriptPath: string): Promise<void> => {
  const command = new Deno.Command('cmd', {
    args: ['/c', 'start', '/min', scriptPath],
    stdout: 'null',
    stderr: 'null',
  })
  await command.output()
}

/**
 * Execute script on Unix
 */
const executeUnix = async (scriptPath: string): Promise<void> => {
  const command = new Deno.Command('sh', {
    args: ['-c', `nohup ${scriptPath} >/dev/null 2>&1 &`],
    stdout: 'null',
    stderr: 'null',
  })
  await command.output()
}
