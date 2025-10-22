/**
 * Job runner - execute commands asynchronously using Vim's job feature
 */

import type { Config, ExecutionContext, ExecutionResult, Runner } from '../types.ts'
import type { Denops } from 'https://deno.land/x/denops_std@v6.5.0/mod.ts'
import { getModuleOption } from '../config.ts'

/**
 * Create job runner
 */
export const createJobRunner = (config: Config): Runner => {
  return {
    name: 'job',
    validate: async (denops: Denops) => {
      const hasJob = await denops.call('has', 'job')
      if (!hasJob) {
        throw new Error('Job feature is not available')
      }
    },
    run: async (
      context: ExecutionContext,
      commands: readonly string[],
      input: string
    ): Promise<ExecutionResult> => {
      let output = ''
      let exitCode = 0

      for (const command of commands) {
        const result = await executeJob(context.denops, command, input, config)
        output += result.output
        exitCode = result.exitCode

        // If command fails, stop execution
        if (exitCode !== 0) {
          break
        }

        // Use output as input for next command
        input = result.output
      }

      return {
        output,
        exitCode,
        success: exitCode === 0,
      }
    },
  }
}

/**
 * Execute a single command using job
 */
const executeJob = async (
  denops: Denops,
  command: string,
  input: string,
  config: Config
): Promise<{ output: string; exitCode: number }> => {
  return new Promise((resolve) => {
    let output = ''
    let exitCode = 0

    const pty = getModuleOption(config, 'runner', 'job', 'pty', 0)

    // Create callback function name
    const callbackName = `NeoQuickRun_Job_Callback_${Date.now()}_${Math.random()}`

    // Define callback in Vim
    denops.cmd(`
      function! ${callbackName}(channel, msg) abort
        let g:${callbackName}_output = get(g:, '${callbackName}_output', '') . a:msg . "\\n"
      endfunction
    `).then(() => {
      // Start job
      denops.call('job_start', command, {
        out_cb: `${callbackName}`,
        err_cb: `${callbackName}`,
        exit_cb: `function('${callbackName}_exit')`,
        pty: pty,
        in_io: 'pipe',
      }).then((job) => {
        // Define exit callback
        denops.cmd(`
          function! ${callbackName}_exit(job, status) abort
            let g:${callbackName}_exitcode = a:status
            let g:${callbackName}_done = 1
          endfunction
        `).then(() => {
          // Send input
          denops.call('ch_sendraw', job, input).then(() => {
            denops.call('ch_close_in', job).then(() => {
              // Wait for completion
              const interval = getModuleOption(
                config,
                'runner',
                'job',
                'interval',
                100
              )
              waitForJob(denops, callbackName, interval).then((result) => {
                // Cleanup
                denops.cmd(`
                  unlet! g:${callbackName}_output
                  unlet! g:${callbackName}_exitcode
                  unlet! g:${callbackName}_done
                  delfunction ${callbackName}
                  delfunction ${callbackName}_exit
                `).then(() => {
                  resolve(result)
                })
              })
            })
          })
        })
      })
    })
  })
}

/**
 * Wait for job completion
 */
const waitForJob = async (
  denops: Denops,
  callbackName: string,
  interval: number
): Promise<{ output: string; exitCode: number }> => {
  // Poll for completion
  while (true) {
    const done = await denops.eval(`get(g:, '${callbackName}_done', 0)`)
    if (done) {
      break
    }
    await sleep(interval)
  }

  // Get result
  const output =
    ((await denops.eval(`get(g:, '${callbackName}_output', '')`)) as string) ||
    ''
  const exitCode =
    ((await denops.eval(
      `get(g:, '${callbackName}_exitcode', 0)`
    )) as number) || 0

  return { output, exitCode }
}

/**
 * Sleep for specified milliseconds
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
