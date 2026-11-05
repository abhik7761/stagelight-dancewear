import raw from '../site.config.json'
import type { CatKey } from './types'

export const config = raw
export const DOMAIN = raw.domain.replace(/\/$/, '')
export const BRAND = raw.brand

export const CATS: Record<CatKey, { label: string; blurb: string }> = {
  shoes: { label: 'Shoes', blurb: 'Ballet, pointe, jazz, tap, hip-hop and lyrical dance shoes for kids and adults.' },
  leotards: { label: 'Leotards', blurb: 'Camisole, tank, short and long sleeve leotards and unitards for class, recitals and gymnastics.' },
  tops: { label: 'Tops', blurb: 'Crop tops, bra tops, tees and jackets that move with you in the studio.' },
  bottoms: { label: 'Bottoms', blurb: 'Dance shorts, leggings, pants and skirts for every style of class.' },
  tights: { label: 'Tights', blurb: 'Footed, convertible, footless and fishnet dance tights.' },
  accessories: { label: 'Accessories', blurb: 'Dance bags, hair accessories, undergarments and extras.' },
}
export const CAT_KEYS = Object.keys(CATS) as CatKey[]

export const STYLES: [string, string][] = [
  ['Ballet', 'ballet'],
  ['Pointe', 'pointe'],
  ['Jazz', 'jazz'],
  ['Tap', 'tap'],
  ['Hip-hop', 'hip-hop'],
  ['Lyrical & contemporary', 'lyrical'],
  ['Gymnastics', 'gymnastics'],
]
