/**
 * Session management for vim-neoquickrun
 * Immutable session handling with functional style
 */

import type {
  Config,
  ExecutionContext,
  ExecutionResult,
  Hook,
  HookPoint,
  Outputter,
  Runner,
  Session,
} from './types.ts'
import type { Denops } from 'https://deno.land/x/denops_std@v6.5.0/mod.ts'
import { pipeAsync } from './utils/functional.ts'

/**
 * Create a new execution context
 */
export const createContext = (
  denops: Denops,
  config: Config,
  src: string,
  srcfile: string
): ExecutionContext => {
  return {
    denops,
    config,
    src,
    srcfile,
    tempfiles: [],
    startTime: Date.now(),
  }
}

/**
 * Add a tempfile to context
 */
export const addTempfile = (
  context: ExecutionContext,
  filepath: string
): ExecutionContext => {
  return {
    ...context,
    tempfiles: [...context.tempfiles, filepath],
  }
}

/**
 * Create a new session
 */
export const createSession = (
  context: ExecutionContext,
  runner: Runner,
  outputter: Outputter,
  hooks: readonly Hook[]
): Session => {
  return {
    id: crypto.randomUUID(),
    context,
    runner,
    outputter,
    hooks: [...hooks].sort((a, b) => a.priority('ready') - b.priority('ready')),
    startTime: Date.now(),
  }
}

/**
 * Invoke hooks at a specific point
 */
export const invokeHooks = async (
  session: Session,
  point: HookPoint,
  data?: string | ExecutionResult
): Promise<Session> => {
  // Sort hooks by priority for this hook point
  const sortedHooks = [...session.hooks].sort(
    (a, b) => a.priority(point) - b.priority(point)
  )

  let currentContext = session.context

  for (const hook of sortedHooks) {
    switch (point) {
      case 'normalized':
        if (hook.on_normalized) {
          currentContext = await hook.on_normalized(currentContext)
        }
        break
      case 'ready':
        if (hook.on_ready) {
          currentContext = await hook.on_ready(currentContext)
        }
        break
      case 'output':
        if (hook.on_output && typeof data === 'string') {
          const [newContext, newData] = await hook.on_output(
            currentContext,
            data
          )
          currentContext = newContext
          data = newData
        }
        break
      case 'success':
        if (hook.on_success && typeof data !== 'string') {
          await hook.on_success(currentContext, data as ExecutionResult)
        }
        break
      case 'failure':
        if (hook.on_failure && typeof data !== 'string') {
          await hook.on_failure(currentContext, data as ExecutionResult)
        }
        break
      case 'finish':
        if (hook.on_finish && typeof data !== 'string') {
          await hook.on_finish(currentContext, data as ExecutionResult)
        }
        break
      case 'exit':
        if (hook.on_exit && typeof data !== 'string') {
          await hook.on_exit(currentContext, data as ExecutionResult)
        }
        break
    }
  }

  return {
    ...session,
    context: currentContext,
  }
}

/**
 * Execute a session
 */
export const executeSession = async (
  session: Session,
  commands: readonly string[],
  input: string
): Promise<ExecutionResult> => {
  // Start outputter
  await session.outputter.start(session.context)

  // Invoke ready hooks
  const readySession = await invokeHooks(session, 'ready')

  // Run the command
  const result = await readySession.runner.run(
    readySession.context,
    commands,
    input
  )

  // Process output through hooks
  let processedOutput = result.output
  for (const hook of readySession.hooks) {
    if (hook.on_output) {
      const [_context, newData] = await hook.on_output(
        readySession.context,
        processedOutput
      )
      processedOutput = newData
    }
  }

  // Output the result
  await readySession.outputter.output(readySession.context, processedOutput)

  // Invoke success/failure hooks
  if (result.success) {
    await invokeHooks(readySession, 'success', result)
  } else {
    await invokeHooks(readySession, 'failure', result)
  }

  // Invoke finish hooks
  await invokeHooks(readySession, 'finish', result)

  // Finish outputter
  await readySession.outputter.finish(readySession.context, result)

  // Cleanup tempfiles
  await cleanupTempfiles(readySession.context)

  // Invoke exit hooks
  await invokeHooks(readySession, 'exit', result)

  return result
}

/**
 * Clean up temporary files
 */
const cleanupTempfiles = async (context: ExecutionContext): Promise<void> => {
  for (const filepath of context.tempfiles) {
    try {
      await Deno.remove(filepath)
    } catch (_error) {
      // Ignore errors when removing tempfiles
    }
  }
}

/**
 * Update session context
 */
export const updateContext = (
  session: Session,
  updater: (context: ExecutionContext) => ExecutionContext
): Session => {
  return {
    ...session,
    context: updater(session.context),
  }
}

/**
 * Update session config
 */
export const updateConfig = (
  session: Session,
  updater: (config: Config) => Config
): Session => {
  return updateContext(session, (context) => ({
    ...context,
    config: updater(context.config),
  }))
}
