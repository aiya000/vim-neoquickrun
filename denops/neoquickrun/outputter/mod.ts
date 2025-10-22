/**
 * Outputter module exports and initialization
 */

import type { Config } from '../types.ts'
import { registerOutputter, getOutputter } from './types.ts'
import { createBufferOutputter } from './buffer.ts'
import { createMessageOutputter } from './message.ts'
import { createNullOutputter } from './null.ts'
import { createQuickfixOutputter } from './quickfix.ts'
import { createLoclistOutputter } from './loclist.ts'
import { createFileOutputter } from './file.ts'
import { createVariableOutputter } from './variable.ts'
import { createMultiOutputter } from './multi.ts'
import { createBufferedOutputter } from './buffered.ts'
import { createErrorOutputter } from './error.ts'
import { createBrowserOutputter } from './browser.ts'
import { createPopupOutputter } from './popup.ts'
import { createFloatOutputter } from './float.ts'

/**
 * Initialize all outputters
 */
export const initializeOutputters = (): void => {
  registerOutputter('buffer', async (config: Config) =>
    createBufferOutputter(config)
  )
  registerOutputter('message', async (config: Config) =>
    createMessageOutputter(config)
  )
  registerOutputter('null', async (config: Config) =>
    createNullOutputter(config)
  )
  registerOutputter('quickfix', async (config: Config) =>
    createQuickfixOutputter(config)
  )
  registerOutputter('loclist', async (config: Config) =>
    createLoclistOutputter(config)
  )
  registerOutputter('file', async (config: Config) =>
    createFileOutputter(config)
  )
  registerOutputter('variable', async (config: Config) =>
    createVariableOutputter(config)
  )
  registerOutputter('multi', async (config: Config) =>
    createMultiOutputter(config)
  )
  registerOutputter('buffered', async (config: Config) =>
    createBufferedOutputter(config)
  )
  registerOutputter('error', async (config: Config) =>
    createErrorOutputter(config)
  )
  registerOutputter('browser', async (config: Config) =>
    createBrowserOutputter(config)
  )
  registerOutputter('popup', async (config: Config) =>
    createPopupOutputter(config)
  )
  registerOutputter('float', async (config: Config) =>
    createFloatOutputter(config)
  )
}

// Re-export
export { getOutputter, registerOutputter } from './types.ts'
export type { OutputterFactory } from './types.ts'
