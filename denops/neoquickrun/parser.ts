/**
 * Command-line argument parser for :NeoQuickRun
 */

import type { CommandArgs, Config } from './types.ts'

/**
 * Parse command-line arguments from :NeoQuickRun
 * Format: :[range]NeoQuickRun [{type}] [<{input}] [>[>][{output}]] [-option value]...
 */
export const parseCommandArgs = (args: string): CommandArgs => {
  const tokens = tokenize(args)
  const result: CommandArgs = {
    options: {},
  }

  let i = 0

  // Parse type (first non-option argument)
  if (i < tokens.length && !tokens[i]?.startsWith('-') && !tokens[i]?.startsWith('<') && !tokens[i]?.startsWith('>')) {
    result.type = tokens[i]
    i++
  }

  // Parse remaining tokens
  while (i < tokens.length) {
    const token = tokens[i]

    if (!token) {
      i++
      continue
    }

    // Input redirection: <file or <@register or <=content
    if (token.startsWith('<')) {
      result.input = token.slice(1)
      i++
      continue
    }

    // Output redirection: >outputter or >>outputter (append)
    if (token.startsWith('>>')) {
      result.output = token.slice(2)
      result.append = true
      i++
      continue
    }

    if (token.startsWith('>')) {
      result.output = token.slice(1)
      result.append = false
      i++
      continue
    }

    // Options: -name value
    if (token.startsWith('-')) {
      const optionName = token.slice(1)
      i++

      // Get option value
      const optionValue = i < tokens.length ? tokens[i] : undefined
      if (optionValue !== undefined && !optionValue.startsWith('-')) {
        result.options[optionName] = parseOptionValue(optionValue)
        i++
      } else {
        // Flag option (no value)
        result.options[optionName] = true
      }
      continue
    }

    i++
  }

  return result
}

/**
 * Tokenize command-line arguments
 * Handle quotes and escaping
 */
const tokenize = (args: string): string[] => {
  const tokens: string[] = []
  let current = ''
  let inQuote: "'" | '"' | null = null
  let escaped = false

  for (let i = 0; i < args.length; i++) {
    const char = args[i]

    if (!char) continue

    if (escaped) {
      current += char
      escaped = false
      continue
    }

    if (char === '\\') {
      escaped = true
      continue
    }

    if (inQuote) {
      if (char === inQuote) {
        inQuote = null
      } else {
        current += char
      }
      continue
    }

    if (char === "'" || char === '"') {
      inQuote = char
      continue
    }

    if (char === ' ' || char === '\t') {
      if (current) {
        tokens.push(current)
        current = ''
      }
      continue
    }

    current += char
  }

  if (current) {
    tokens.push(current)
  }

  return tokens
}

/**
 * Parse option value (convert string to appropriate type)
 */
const parseOptionValue = (value: string): unknown => {
  // Boolean
  if (value === 'true' || value === '1') return true
  if (value === 'false' || value === '0') return false

  // Number
  const num = Number(value)
  if (!isNaN(num) && value === String(num)) return num

  // Array (comma-separated)
  if (value.includes(',')) {
    return value.split(',').map((v) => v.trim())
  }

  // String
  return value
}

/**
 * Build config from command args
 */
export const buildConfigFromArgs = (commandArgs: CommandArgs): Config => {
  const config: Config = { ...commandArgs.options }

  if (commandArgs.type) {
    config.type = commandArgs.type
  }

  if (commandArgs.input) {
    config.input = commandArgs.input
  }

  if (commandArgs.output) {
    config.outputter = commandArgs.output
  }

  if (commandArgs.append !== undefined) {
    config['outputter/append'] = commandArgs.append
  }

  return config
}
