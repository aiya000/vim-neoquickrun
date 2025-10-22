/**
 * Float outputter - output to Neovim floating window (NEW FEATURE)
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
 * Create float outputter
 */
export const createFloatOutputter = (config: Config): Outputter => {
  let bufnr: number | undefined
  let winid: number | undefined
  let floatBuffer = ''

  return {
    name: 'float',
    validate: async (denops: Denops) => {
      // Check if Neovim
      const isNvim = await denops.call('has', 'nvim')
      if (!isNvim) {
        throw new Error(
          'Floating window is not supported in Vim. This feature requires Neovim.'
        )
      }

      // Check nvim_open_win availability
      const hasNvimOpenWin = await denops.call('exists', '*nvim_open_win')
      if (!hasNvimOpenWin) {
        throw new Error('nvim_open_win() is not available')
      }
    },
    start: async (context: ExecutionContext) => {
      floatBuffer = ''

      // Create buffer
      bufnr = (await context.denops.call('nvim_create_buf', false, true)) as number

      // Set buffer options
      await context.denops.call('nvim_buf_set_option', bufnr, 'buftype', 'nofile')
      await context.denops.call('nvim_buf_set_option', bufnr, 'bufhidden', 'wipe')
      await context.denops.call('nvim_buf_set_option', bufnr, 'swapfile', false)

      // Get window dimensions
      const width = getModuleOption(config, 'outputter', 'float', 'width', 80)
      const height = getModuleOption(config, 'outputter', 'float', 'height', 20)
      const row = getModuleOption(config, 'outputter', 'float', 'row', 5)
      const col = getModuleOption(config, 'outputter', 'float', 'col', 10)
      const border = getModuleOption(
        config,
        'outputter',
        'float',
        'border',
        'rounded'
      )

      // Open floating window
      winid = (await context.denops.call('nvim_open_win', bufnr, true, {
        relative: 'editor',
        width: width,
        height: height,
        row: row,
        col: col,
        border: border,
        style: 'minimal',
        title: ' NeoQuickRun Output ',
        title_pos: 'center',
      })) as number

      // Set window options
      await context.denops.call('nvim_win_set_option', winid, 'wrap', true)
      await context.denops.call('nvim_win_set_option', winid, 'cursorline', true)

      // Set filetype
      const filetype = getModuleOption(
        config,
        'outputter',
        'float',
        'filetype',
        'neoquickrun'
      )
      await context.denops.call('nvim_buf_set_option', bufnr, 'filetype', filetype)

      // Show running mark
      const runningMark = getModuleOption(
        config,
        'outputter',
        'float',
        'running_mark',
        'running...'
      )
      if (runningMark) {
        await context.denops.call('nvim_buf_set_lines', bufnr, 0, -1, false, [
          runningMark,
        ])
      }
    },
    output: async (context: ExecutionContext, data: string) => {
      if (bufnr === undefined) return

      floatBuffer += data
      const lines = floatBuffer.split('\n')

      // Update buffer content
      await context.denops.call('nvim_buf_set_lines', bufnr, 0, -1, false, lines)

      // Scroll to bottom
      if (winid !== undefined) {
        const lineCount = lines.length
        await context.denops.call('nvim_win_set_cursor', winid, [
          lineCount,
          0,
        ])
      }
    },
    finish: async (context: ExecutionContext, result: ExecutionResult) => {
      if (bufnr === undefined) return

      // Remove running mark if present
      const runningMark = getModuleOption(
        config,
        'outputter',
        'float',
        'running_mark',
        'running...'
      )
      if (runningMark) {
        const lines = (await context.denops.call(
          'nvim_buf_get_lines',
          bufnr,
          0,
          -1,
          false
        )) as string[]
        const filtered = lines.filter((line) => line !== runningMark)
        await context.denops.call('nvim_buf_set_lines', bufnr, 0, -1, false, filtered)
      }

      // Close on empty if configured
      const closeOnEmpty = getModuleOption(
        config,
        'outputter',
        'float',
        'close_on_empty',
        0
      )
      if (closeOnEmpty && winid !== undefined) {
        const lines = (await context.denops.call(
          'nvim_buf_get_lines',
          bufnr,
          0,
          -1,
          false
        )) as string[]
        if (lines.length === 0 || (lines.length === 1 && lines[0] === '')) {
          await context.denops.call('nvim_win_close', winid, true)
        }
      }

      // Auto-close after delay if configured
      const autoClose = getModuleOption(
        config,
        'outputter',
        'float',
        'auto_close',
        0
      )
      if (autoClose > 0 && winid !== undefined) {
        const closeWinid = winid
        setTimeout(async () => {
          try {
            await context.denops.call('nvim_win_close', closeWinid, true)
          } catch (_error) {
            // Window may already be closed
          }
        }, autoClose)
      }
    },
  }
}
