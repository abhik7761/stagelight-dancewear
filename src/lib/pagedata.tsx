import { createContext } from 'react'
import type { PageData } from '../types'

/** Data injected by the prerenderer (server) or read from window.__DATA__ (browser) so hydration matches. */
export const DataCtx = createContext<PageData>({})
