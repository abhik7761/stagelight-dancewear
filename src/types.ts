export type CatKey = 'shoes' | 'leotards' | 'tops' | 'bottoms' | 'tights' | 'accessories'

export interface Variant {
  k: string // variant sku
  c: string // color
  s: string // size
  g: string // Child | Adult | Plus
  p: number // price
}

/** Light record used on listing pages, search and cards. */
export interface ProductLite {
  slug: string
  sku: string
  name: string
  brand: string
  cat: CatKey
  sub: string
  pmin: number
  pmax: number
  main: string
  colors: string[]
  groups: string[]
}

/** Full record fetched for a product page. */
export interface ProductFull extends ProductLite {
  bullets: string[]
  details: [string, string][]
  country: string
  material: string
  cimgs: Record<string, string>
  extras: string[]
  sizes: [string, string][]
  variants: Variant[]
}

export interface CartItem {
  k: string
  slug: string
  name: string
  brand: string
  color: string
  size: string
  price: number
  qty: number
  img: string
}

export interface HeadData {
  title: string
  description: string
  canonical: string
  image?: string
  noindex?: boolean
  jsonld?: object[]
}

export interface PageData {
  product?: ProductFull
}
