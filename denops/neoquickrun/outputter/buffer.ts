/**
 * Buffer outputter - output to a buffer
 */

import type {
  Config,
  ExecutionContext,
  ExecutionResult,
  Outputter,
} from '../types.ts'
import type { Denops } from 'https://deno.land/x/denops_std@v6.5.0/mod.ts'
import { getModuleOption } from '../config.ts'
import * as buffer from 'https://deno.land/x/denops_std@v6.5.0/buffer/mod.ts'

/**
 * Create buffer outputter
 */
export const createBufferOutputter = (config: Config): Outputter => {
  let bufnr: number | undefined

  return {
    name: 'buffer',
    validate: async (_denops: Denops) => {
      // Buffer outputter is always available
    },
    start: async (context: ExecutionContext) => {
      const bufname = getModuleOption(
        config,
        'outputter',
        'buffer',
        'bufname',
        'neoquickrun://output'
      )
      const append = getModuleOption(config, 'outputter', 'buffer', 'append', 0)
      const runningMark = getModuleOption(
        config,
        'outputter',
        'buffer',
        'running_mark',
        'running...'
      )

      // Find or create buffer
      bufnr = await findOrCreateBuffer(context.denops, bufname)

      // Clear buffer if not appending
      if (!append) {
        await buffer.replace(context.denops, bufnr, [])
      }

      // Show running mark
      if (runningMark) {
        await buffer.append(context.denops, bufnr, [runningMark])
      }

      // Open buffer window
      await openBufferWindow(context.denops, bufnr, config)
    },
    output: async (context: ExecutionContext, data: string) => {
      if (bufnr === undefined) return

      // Split data into lines
      const lines = data.split('\n')

      // Remove running mark if present
      const runningMark = getModuleOption(
        config,
        'outputter',
        'buffer',
        'running_mark',
        'running...'
      )
      if (runningMark) {
        const currentLines = await buffer.get(context.denops, bufnr)
        if (currentLines[currentLines.length - 1] === runningMark) {
          await buffer.replace(
            context.denops,
            bufnr,
            currentLines.slice(0, -1)
          )
        }
      }

      // Append lines
      await buffer.append(context.denops, bufnr, lines)
    },
    finish: async (context: ExecutionContext, result: ExecutionResult) => {
      if (bufnr === undefined) return

      // Remove running mark
      const runningMark = getModuleOption(
        config,
        'outputter',
        'buffer',
        'running_mark',
        'running...'
      )
      if (runningMark) {
        const currentLines = await buffer.get(context.denops, bufnr)
        const filtered = currentLines.filter((line) => line !== runningMark)
        if (filtered.length !== currentLines.length) {
          await buffer.replace(context.denops, bufnr, filtered)
        }
      }

      // Close empty buffer if configured
      const closeOnEmpty = getModuleOption(
        config,
        'outputter',
        'buffer',
        'close_on_empty',
        0
      )
      if (closeOnEmpty) {
        const lines = await buffer.get(context.denops, bufnr)
        if (lines.length === 0 || (lines.length === 1 && lines[0] === '')) {
          await context.denops.cmd(`silent! bwipeout ${bufnr}`)
        }
      }

      // Set filetype
      const filetype = getModuleOption(
        config,
        'outputter',
        'buffer',
        'filetype',
        'neoquickrun'
      )
      await context.denops.cmd(`call setbufvar(${bufnr}, '&filetype', '${filetype}')`)
    },
  }
}

/**
 * Find or create buffer
 */
const findOrCreateBuffer = async (
  denops: Denops,
  bufname: string
): Promise<number> => {
  // Check if buffer exists
  const existingBufnr = await denops.call('bufnr', bufname)
  if (typeof existingBufnr === 'number' && existingBufnr !== -1) {
    return existingBufnr
  }

  // Create new buffer
  await denops.cmd(`silent! enew`)
  await denops.cmd(`silent! file ${bufname}`)
  await denops.cmd('setlocal buftype=nofile bufhidden=hide noswapfile')

  const bufnr = await denops.call('bufnr', '%')
  return bufnr as number
}

/**
 * Open buffer window
 */
const openBufferWindow = async (
  denops: Denops,
  bufnr: number,
  config: Config
): Promise<void> => {
  const opener = getModuleOption(
    config,
    'outputter',
    'buffer',
    'opener',
    '%{winwidth(0) * 2 < winheight(0) * 5 ? "new" : "vnew"}'
  )
  const into = getModuleOption(config, 'outputter', 'buffer', 'into', 0)

  // Expand opener if it contains expressions
  const expandedOpener = opener.includes('%{')
    ? ((await denops.eval(`"${opener}"`)) as string)
    : opener

  // Check if buffer is visible
  const winid = await denops.call('bufwinid', bufnr)

  if (winid === -1) {
    // Buffer is not visible, open it
    await denops.cmd(`${expandedOpener}`)
    await denops.cmd(`buffer ${bufnr}`)
  } else if (into) {
    // Move to buffer window
    await denops.call('win_gotoid', winid)
  }
}
