/**
 * Runner type definitions and factory
 */

import type { Config, ExecutionContext, ExecutionResult, Runner } from '../types.ts'
import type { Denops } from 'https://deno.land/x/denops_std@v6.5.0/mod.ts'

/**
 * Create a runner from config
 */
export type RunnerFactory = (config: Config) => Promise<Runner>

/**
 * Runner registry
 */
const runners = new Map<string, RunnerFactory>()

/**
 * Register a runner
 */
export const registerRunner = (name: string, factory: RunnerFactory): void => {
  runners.set(name, factory)
}

/**
 * Get a runner by name
 */
export const getRunner = async (
  name: string,
  config: Config
): Promise<Runner> => {
  const factory = runners.get(name)
  if (!factory) {
    throw new Error(`Runner "${name}" not found`)
  }
  return await factory(config)
}

/**
 * Check if a runner exists
 */
export const hasRunner = (name: string): boolean => {
  return runners.has(name)
}

/**
 * Get all registered runner names
 */
export const getRunnerNames = (): string[] => {
  return Array.from(runners.keys())
}
