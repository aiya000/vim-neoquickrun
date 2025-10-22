/**
 * System runner - execute commands synchronously using Deno.Command
 */

import type { Config, ExecutionContext, ExecutionResult, Runner } from '../types.ts'
import type { Denops } from 'https://deno.land/x/denops_std@v6.5.0/mod.ts'

/**
 * Create system runner
 */
export const createSystemRunner = (_config: Config): Runner => {
  return {
    name: 'system',
    validate: async (_denops: Denops) => {
      // System runner is always available
    },
    run: async (
      _context: ExecutionContext,
      commands: readonly string[],
      input: string
    ): Promise<ExecutionResult> => {
      let output = ''
      let exitCode = 0

      for (const command of commands) {
        const result = await executeCommand(command, input)
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
 * Execute a single command
 */
const executeCommand = async (
  command: string,
  input: string
): Promise<{ output: string; exitCode: number }> => {
  try {
    // Parse command and arguments
    const args = parseCommand(command)
    if (args.length === 0) {
      return { output: '', exitCode: 1 }
    }

    const cmd = args[0]
    const cmdArgs = args.slice(1)

    // Create command
    const process = new Deno.Command(cmd, {
      args: cmdArgs,
      stdin: 'piped',
      stdout: 'piped',
      stderr: 'piped',
    })

    // Spawn process
    const child = process.spawn()

    // Write input to stdin
    const writer = child.stdin.getWriter()
    await writer.write(new TextEncoder().encode(input))
    await writer.close()

    // Wait for completion
    const { code, stdout, stderr } = await child.output()

    // Combine stdout and stderr
    const outputText = new TextDecoder().decode(stdout)
    const errorText = new TextDecoder().decode(stderr)
    const output = outputText + errorText

    return {
      output,
      exitCode: code,
    }
  } catch (error) {
    return {
      output: `Error executing command: ${error}`,
      exitCode: 1,
    }
  }
}

/**
 * Parse command string into command and arguments
 * Simple shell-like parsing
 */
const parseCommand = (command: string): string[] => {
  const args: string[] = []
  let current = ''
  let inQuote: "'" | '"' | null = null
  let escaped = false

  for (let i = 0; i < command.length; i++) {
    const char = command[i]

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
        args.push(current)
        current = ''
      }
      continue
    }

    current += char
  }

  if (current) {
    args.push(current)
  }

  return args
}
