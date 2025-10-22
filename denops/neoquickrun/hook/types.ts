/**
 * Hook type definitions and factory
 */

import type { Config, Hook } from '../types.ts'

/**
 * Create a hook from config
 */
export type HookFactory = (config: Config) => Promise<Hook>

/**
 * Hook registry
 */
const hooks = new Map<string, HookFactory>()

/**
 * Register a hook
 */
export const registerHook = (name: string, factory: HookFactory): void => {
  hooks.set(name, factory)
}

/**
 * Get a hook by name
 */
export const getHook = async (name: string, config: Config): Promise<Hook> => {
  const factory = hooks.get(name)
  if (!factory) {
    throw new Error(`Hook "${name}" not found`)
  }
  return await factory(config)
}

/**
 * Check if a hook exists
 */
export const hasHook = (name: string): boolean => {
  return hooks.has(name)
}

/**
 * Get all registered hook names
 */
export const getHookNames = (): string[] => {
  return Array.from(hooks.keys())
}

/**
 * Get hooks from config
 */
export const getHooksFromConfig = async (
  config: Config
): Promise<readonly Hook[]> => {
  const hookNames = config.hooks || []
  if (!Array.isArray(hookNames)) {
    return []
  }

  const hookPromises = hookNames.map((name) => getHook(name, config))
  return await Promise.all(hookPromises)
}
