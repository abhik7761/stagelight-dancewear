import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import type { CartItem } from '../types'

const KEY = 'dw_cart'

type Action =
  | { type: 'load'; items: CartItem[] }
  | { type: 'add'; item: CartItem }
  | { type: 'qty'; k: string; qty: number }
  | { type: 'remove'; k: string }
  | { type: 'clear' }

function reducer(state: CartItem[], a: Action): CartItem[] {
  switch (a.type) {
    case 'load':
      return a.items
    case 'add': {
      const found = state.find((i) => i.k === a.item.k)
      if (found) return state.map((i) => (i.k === a.item.k ? { ...i, qty: Math.min(20, i.qty + a.item.qty) } : i))
      return [...state, a.item]
    }
    case 'qty':
      return state.map((i) => (i.k === a.k ? { ...i, qty: Math.max(1, Math.min(20, a.qty)) } : i))
    case 'remove':
      return state.filter((i) => i.k !== a.k)
    case 'clear':
      return []
  }
}

interface CartApi {
  items: CartItem[]
  count: number
  subtotal: number
  notice: string | null
  add: (item: CartItem) => void
  setQty: (k: string, qty: number) => void
  remove: (k: string) => void
  clear: () => void
}

const Ctx = createContext<CartApi | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(reducer, [])
  const [notice, setNotice] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  // Load once after mount. Persisting is blocked until this has run, otherwise the empty initial state
  // would overwrite the saved cart (StrictMode in dev runs mount effects twice).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) dispatch({ type: 'load', items: JSON.parse(raw) as CartItem[] })
    } catch {
      /* storage unavailable: cart lives in memory only */
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(KEY, JSON.stringify(items))
    } catch {
      /* ignore */
    }
  }, [items, hydrated])

  const add = useCallback((item: CartItem) => {
    dispatch({ type: 'add', item })
    setNotice(`Added to cart: ${item.name} (${item.color}, ${item.size})`)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setNotice(null), 4500)
  }, [])

  const api = useMemo<CartApi>(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.qty, 0),
      subtotal: items.reduce((n, i) => n + i.qty * i.price, 0),
      notice,
      add,
      setQty: (k, qty) => dispatch({ type: 'qty', k, qty }),
      remove: (k) => dispatch({ type: 'remove', k }),
      clear: () => dispatch({ type: 'clear' }),
    }),
    [items, notice, add],
  )
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useCart() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useCart must be used inside CartProvider')
  return c
}
