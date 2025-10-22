/**
 * Configuration system for vim-neoquickrun
 * Pure functions for config merging and resolution
 */

import type { Denops } from 'https://deno.land/x/denops_std@v6.5.0/mod.ts'
import * as v from 'https://deno.land/x/denops_std@v6.5.0/variable/mod.ts'
import type { Config } from './types.ts'
import { deepMerge, merge } from './utils/functional.ts'

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: Config = {
  outputter: 'buffer',
  runner: 'job',
  cmdopt: '',
  args: '',
  tempfile: '%{tempname()}',
  exec: '%c %o %s %a',
}

/**
 * Get configuration from Vim variables
 */
export const getVimConfig = async (denops: Denops): Promise<Config> => {
  try {
    const globalConfig = await v.g.get(denops, 'neoquickrun_config', {})
    return globalConfig as Config
  } catch (_error) {
    return {}
  }
}

/**
 * Get buffer-local configuration
 */
export const getBufferConfig = async (denops: Denops): Promise<Config> => {
  try {
    const bufferConfig = await v.b.get(denops, 'neoquickrun_config', {})
    return bufferConfig as Config
  } catch (_error) {
    return {}
  }
}

/**
 * Get configuration for a specific type
 */
export const getTypeConfig = async (
  denops: Denops,
  type: string
): Promise<Config> => {
  const globalConfig = await getVimConfig(denops)
  const typeConfig = (globalConfig as Record<string, unknown>)[type]

  if (typeConfig && typeof typeConfig === 'object') {
    return typeConfig as Config
  }

  return {}
}

/**
 * Get default type configuration
 */
export const getDefaultTypeConfig = async (
  denops: Denops
): Promise<Config> => {
  const globalConfig = await getVimConfig(denops)
  const defaultConfig = (globalConfig as Record<string, unknown>)['_']

  if (defaultConfig && typeof defaultConfig === 'object') {
    return defaultConfig as Config
  }

  return {}
}

/**
 * Resolve configuration with priority:
 * 1. Command-line options
 * 2. Buffer-local config
 * 3. Type-specific config
 * 4. Default type config (_)
 * 5. Built-in defaults
 */
export const resolveConfig = async (
  denops: Denops,
  commandLineConfig: Config
): Promise<Config> => {
  const type = commandLineConfig.type || (await getFiletype(denops))

  const builtinDefaults = DEFAULT_CONFIG
  const defaultTypeConfig = await getDefaultTypeConfig(denops)
  const typeConfig = await getTypeConfig(denops, type)
  const bufferConfig = await getBufferConfig(denops)

  // Merge configs with priority
  const merged = deepMerge(
    deepMerge(
      deepMerge(deepMerge(builtinDefaults, defaultTypeConfig), typeConfig),
      bufferConfig
    ),
    commandLineConfig
  )

  return {
    ...merged,
    type,
  }
}

/**
 * Get current filetype
 */
const getFiletype = async (denops: Denops): Promise<string> => {
  try {
    const ft = await v.bo.get(denops, 'filetype')
    return typeof ft === 'string' ? ft : ''
  } catch (_error) {
    return ''
  }
}

/**
 * Expand special syntax in config values
 * Syntax:
 * - @a: register a
 * - &{option}: Vim option
 * - ${env}: environment variable
 * - %{expr}: Vim expression
 */
export const expandConfigValue = async (
  denops: Denops,
  value: string
): Promise<string> => {
  let result = value

  // Expand registers: @a, @{name}
  result = await expandPattern(
    denops,
    result,
    /@(\w+|\{\w+\})/g,
    async (match) => {
      const regName = match.replace(/[@{}]/g, '')
      try {
        return (await denops.call('getreg', regName)) as string
      } catch (_error) {
        return ''
      }
    }
  )

  // Expand options: &option, &{option}
  result = await expandPattern(
    denops,
    result,
    /&(\w+|\{\w+\})/g,
    async (match) => {
      const optName = match.replace(/[&{}]/g, '')
      try {
        return String(await denops.eval(`&${optName}`))
      } catch (_error) {
        return ''
      }
    }
  )

  // Expand environment variables: $VAR, ${VAR}
  result = result.replace(/\$(\w+|\{\w+\})/g, (match) => {
    const envName = match.replace(/[${}]/g, '')
    return Deno.env.get(envName) || ''
  })

  // Expand Vim expressions: %{expr}
  result = await expandPattern(
    denops,
    result,
    /%\{([^}]+)\}/g,
    async (_match, expr) => {
      try {
        return String(await denops.eval(expr))
      } catch (_error) {
        return ''
      }
    }
  )

  return result
}

/**
 * Helper function to expand patterns asynchronously
 */
const expandPattern = async (
  denops: Denops,
  text: string,
  pattern: RegExp,
  replacer: (match: string, ...args: string[]) => Promise<string>
): Promise<string> => {
  const matches = [...text.matchAll(pattern)]
  let result = text

  for (const match of matches) {
    const replacement = await replacer(match[0], ...(match.slice(1) as string[]))
    result = result.replace(match[0], replacement)
  }

  return result
}

/**
 * Expand exec format placeholders
 * %c: command
 * %o: cmdopt
 * %s: srcfile (escaped)
 * %S: srcfile (not escaped)
 * %a: args
 * %%: %
 */
export const expandExecFormat = (
  format: string,
  config: Config,
  srcfile: string
): string => {
  let result = format

  // Replace placeholders
  result = result.replace(/%%/g, '\x00') // Temporary placeholder for %%
  result = result.replace(/%c/g, config.command || config.type || '')
  result = result.replace(/%o/g, config.cmdopt || '')
  result = result.replace(/%s/g, escapeShell(srcfile))
  result = result.replace(/%S/g, srcfile)
  result = result.replace(/%a/g, config.args || '')
  result = result.replace(/\x00/g, '%') // Restore %%

  return result
}

/**
 * Escape string for shell
 */
const escapeShell = (str: string): string => {
  if (Deno.build.os === 'windows') {
    return `"${str.replace(/"/g, '""')}"`
  } else {
    return `'${str.replace(/'/g, "'\\''")}'`
  }
}

/**
 * Build commands from exec option
 */
export const buildCommands = (config: Config, srcfile: string): string[] => {
  const exec = config.exec

  if (typeof exec === 'string') {
    return [expandExecFormat(exec, config, srcfile)]
  }

  if (Array.isArray(exec)) {
    return exec.map((fmt) => expandExecFormat(fmt, config, srcfile))
  }

  return []
}

/**
 * Get module-specific option
 * Priority:
 * 1. {module-type}/{module-name}/{option-name}
 * 2. {module-name}/{option-name}
 * 3. {module-type}/{option-name}
 * 4. {option-name}
 */
export const getModuleOption = <T>(
  config: Config,
  moduleType: string,
  moduleName: string,
  optionName: string,
  defaultValue: T
): T => {
  const keys = [
    `${moduleType}/${moduleName}/${optionName}`,
    `${moduleName}/${optionName}`,
    `${moduleType}/${optionName}`,
    optionName,
  ]

  for (const key of keys) {
    const value = config[key]
    if (value !== undefined) {
      return value as T
    }
  }

  return defaultValue
}
