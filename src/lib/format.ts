import { config } from '../config'
import type { ProductLite } from '../types'

export const money = (v: number) => `${config.currencySymbol}${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
export const sentence = (s: string) => {
  const t = s.replace(/ and /g, ' & ')
  return t.charAt(0).toUpperCase() + t.slice(1)
}
export const colorSlug = (c: string) => c.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
export const imgUrl = (file: string) => `/img/p/${file}`
export const swatchUrl = (color: string) => `/img/sw/${colorSlug(color)}.webp`
export const priceLabel = (p: Pick<ProductLite, 'pmin' | 'pmax'>) => (p.pmin !== p.pmax ? 'From ' : '') + money(p.pmin)
