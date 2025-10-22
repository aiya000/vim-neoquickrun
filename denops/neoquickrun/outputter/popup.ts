/**
 * Popup outputter - output to popup window
 */

import type {
  Config,
  ExecutionContext,
  ExecutionResult,
  Outputter,
} from '../types.ts'
import type { Denops } from 'https://deno.land/x/denops_std@v6.5.0/mod.ts'

/**
 * Create popup outputter
 */
export const createPopupOutputter = (_config: Config): Outputter => {
  let buffer = ''
  let popupId: number | undefined

  return {
    name: 'popup',
    validate: async (denops: Denops) => {
      const hasPopup = await denops.call('exists', '*popup_create')
      if (!hasPopup) {
        throw new Error('Popup feature is not available')
      }
    },
    start: async (context: ExecutionContext) => {
      buffer = ''

      // Create popup window
      popupId = (await context.denops.call('popup_create', [], {
        title: 'NeoQuickRun Output',
        line: 'cursor+1',
        col: 'cursor',
        minwidth: 80,
        minheight: 20,
        maxwidth: 120,
        maxheight: 40,
        border: [1, 1, 1, 1],
        close: 'click',
        moved: 'any',
      })) as number
    },
    output: async (context: ExecutionContext, data: string) => {
      buffer += data

      if (popupId !== undefined) {
        const lines = buffer.split('\n')
        await context.denops.call('popup_settext', popupId, lines)
      }
    },
    finish: async (_context: ExecutionContext, _result: ExecutionResult) => {
      // Popup remains open - user can close it manually
    },
  }
}
