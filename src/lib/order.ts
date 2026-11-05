import type { CartItem } from '../types'

export interface PlacedOrder {
  id: string
  items: CartItem[]
  total: number
  name: string
  email: string
  address: string
  /** true once the conversion event has been sent, so a page refresh never counts twice */
  tracked?: boolean
  /** false when the order went nowhere (no form service configured) - used only to suppress ad conversions */
  delivered: boolean
}

const KEY = 'dw_last_order'

export const saveOrder = (o: PlacedOrder) => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(o))
  } catch {
    /* storage blocked: thank-you page falls back to its generic message */
  }
}

export const loadOrder = (): PlacedOrder | null => {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as PlacedOrder) : null
  } catch {
    return null
  }
}

export const markTracked = (o: PlacedOrder) => saveOrder({ ...o, tracked: true })
