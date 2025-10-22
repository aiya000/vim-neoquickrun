/**
 * Core type definitions for vim-neoquickrun
 * Functional Programming style - immutable data structures
 */

import type { Denops } from 'https://deno.land/x/denops_std@v6.5.0/mod.ts'

/**
 * Configuration for a single execution
 */
export type Config = {
  readonly type?: string
  readonly exec?: string | readonly string[]
  readonly command?: string
  readonly cmdopt?: string
  readonly srcfile?: string
  readonly src?: string
  readonly args?: string
  readonly input?: string
  readonly outputter?: string
  readonly runner?: string
  readonly hooks?: readonly string[]
  readonly mode?: 'n' | 'v' | 'o'
  readonly tempfile?: string
  // Allow arbitrary string keys for module-specific options
  readonly [key: string]: unknown
}

/**
 * Execution context containing all runtime information
 */
export type ExecutionContext = {
  readonly denops: Denops
  readonly config: Config
  readonly src: string
  readonly srcfile: string
  readonly tempfiles: readonly string[]
  readonly startTime: number
}

/**
 * Result of command execution
 */
export type ExecutionResult = {
  readonly output: string
  readonly exitCode: number
  readonly success: boolean
}

/**
 * Runner function type
 */
export type Runner = {
  readonly name: string
  readonly validate: (denops: Denops) => Promise<void>
  readonly run: (
    context: ExecutionContext,
    commands: readonly string[],
    input: string
  ) => Promise<ExecutionResult>
}

/**
 * Outputter function type
 */
export type Outputter = {
  readonly name: string
  readonly validate: (denops: Denops) => Promise<void>
  readonly start: (context: ExecutionContext) => Promise<void>
  readonly output: (context: ExecutionContext, data: string) => Promise<void>
  readonly finish: (
    context: ExecutionContext,
    result: ExecutionResult
  ) => Promise<void>
}

/**
 * Hook point where hooks can be invoked
 */
export type HookPoint =
  | 'normalized'
  | 'ready'
  | 'output'
  | 'success'
  | 'failure'
  | 'finish'
  | 'exit'

/**
 * Hook function type
 */
export type Hook = {
  readonly name: string
  readonly priority: (point: HookPoint) => number
  readonly on_normalized?: (context: ExecutionContext) => Promise<ExecutionContext>
  readonly on_ready?: (context: ExecutionContext) => Promise<ExecutionContext>
  readonly on_output?: (
    context: ExecutionContext,
    data: string
  ) => Promise<readonly [ExecutionContext, string]>
  readonly on_success?: (
    context: ExecutionContext,
    result: ExecutionResult
  ) => Promise<void>
  readonly on_failure?: (
    context: ExecutionContext,
    result: ExecutionResult
  ) => Promise<void>
  readonly on_finish?: (
    context: ExecutionContext,
    result: ExecutionResult
  ) => Promise<void>
  readonly on_exit?: (
    context: ExecutionContext,
    result: ExecutionResult
  ) => Promise<void>
}

/**
 * Session representing a single execution
 */
export type Session = {
  readonly id: string
  readonly context: ExecutionContext
  readonly runner: Runner
  readonly outputter: Outputter
  readonly hooks: readonly Hook[]
  readonly startTime: number
}

/**
 * Module registry types
 */
export type RunnerFactory = (config: Config) => Runner
export type OutputterFactory = (config: Config) => Outputter
export type HookFactory = (config: Config) => Hook

/**
 * Command line arguments parsed from :NeoQuickRun
 */
export type CommandArgs = {
  readonly type?: string
  readonly range?: readonly [number, number]
  readonly input?: string
  readonly output?: string
  readonly append?: boolean
  readonly options: Config
}

/**
 * Error types
 */
export type NeoQuickRunError =
  | { readonly type: 'config'; readonly message: string }
  | { readonly type: 'runner'; readonly message: string }
  | { readonly type: 'outputter'; readonly message: string }
  | { readonly type: 'hook'; readonly message: string }
  | { readonly type: 'execution'; readonly message: string }

/**
 * Result type for operations that can fail
 */
export type Result<T, E = NeoQuickRunError> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E }
