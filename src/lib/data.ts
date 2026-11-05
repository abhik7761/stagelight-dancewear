import raw from '../data/products.json'
import type { CatKey, ProductLite } from '../types'
import { slugify } from './format'

export const PRODUCTS = raw as ProductLite[]

/** Teaching order for shoe styles (most common classes first). */
const SHOE_ORDER = ['ballet slippers', 'pointe', 'jazz', 'tap and character', 'hip-hop and sneakers', 'lyrical and contemporary', 'acro and gymnastics']

export const inCat = (cat: CatKey) => PRODUCTS.filter((p) => p.cat === cat)

/** Sub-categories of a category (only those with products). */
export const subsOf = (cat: CatKey): string[] => {
  const s: string[] = []
  for (const p of PRODUCTS) if (p.cat === cat && p.sub && !s.includes(p.sub)) s.push(p.sub)
  return cat === 'shoes' ? s.sort((a, b) => SHOE_ORDER.indexOf(a) - SHOE_ORDER.indexOf(b)) : s
}

export const subSlugToName = (cat: CatKey, slug: string) => subsOf(cat).find((s) => slugify(s) === slug)

export const related = (p: ProductLite, n = 4): ProductLite[] =>
  PRODUCTS.filter((q) => q.cat === p.cat && q.slug !== p.slug)
    .sort((a, b) => Number(a.sub !== p.sub) - Number(b.sub !== p.sub) || Math.abs(a.pmin - p.pmin) - Math.abs(b.pmin - p.pmin))
    .slice(0, n)

export const search = (q: string, limit = 6): ProductLite[] => {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean)
  if (!terms.length) return []
  return PRODUCTS.filter((p) => {
    const hay = `${p.name} ${p.brand} ${p.sku} ${p.sub} ${p.cat}`.toLowerCase()
    return terms.every((t) => hay.includes(t))
  }).slice(0, limit)
}

const nameCount = new Map<string, number>()
for (const p of PRODUCTS) nameCount.set(p.name, (nameCount.get(p.name) ?? 0) + 1)
/** Product name, with the item number appended when two products share a name (keeps page titles unique for SEO). */
export const uniqueName = (p: Pick<ProductLite, 'name' | 'sku'>) => ((nameCount.get(p.name) ?? 0) > 1 ? `${p.name} (${p.sku})` : p.name)
