/**
 * Outputter type definitions and factory
 */

import type { Config, Outputter } from '../types.ts'

/**
 * Create an outputter from config
 */
export type OutputterFactory = (config: Config) => Promise<Outputter>

/**
 * Outputter registry
 */
const outputters = new Map<string, OutputterFactory>()

/**
 * Register an outputter
 */
export const registerOutputter = (
  name: string,
  factory: OutputterFactory
): void => {
  outputters.set(name, factory)
}

/**
 * Get an outputter by name
 */
export const getOutputter = async (
  name: string,
  config: Config
): Promise<Outputter> => {
  const factory = outputters.get(name)
  if (!factory) {
    throw new Error(`Outputter "${name}" not found`)
  }
  return await factory(config)
}

/**
 * Check if an outputter exists
 */
export const hasOutputter = (name: string): boolean => {
  return outputters.has(name)
}

/**
 * Get all registered outputter names
 */
export const getOutputterNames = (): string[] => {
  return Array.from(outputters.keys())
}
