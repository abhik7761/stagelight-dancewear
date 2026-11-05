import { createContext, useContext, useEffect } from 'react'
import { BRAND, DOMAIN } from '../config'
import type { HeadData } from '../types'

/** Collector used while prerendering: pages call <Seo/>, the prerender script reads the result. */
export interface HeadCollector {
  data: HeadData | null
}
export const HeadCtx = createContext<HeadCollector | null>(null)

const setMeta = (attr: 'name' | 'property', key: string, value: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', value)
}

export function Seo(props: HeadData) {
  const collector = useContext(HeadCtx)
  if (collector) collector.data = props // server render: record synchronously

  const { title, description, canonical, image, noindex, jsonld } = props
  const ldKey = JSON.stringify(jsonld ?? [])
  useEffect(() => {
    document.title = title
    setMeta('name', 'description', description)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', canonical)
    setMeta('name', 'robots', noindex ? 'noindex,follow' : 'index,follow')
    if (image) setMeta('property', 'og:image', image)
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'canonical'
      document.head.appendChild(link)
    }
    link.href = canonical
    document.head.querySelectorAll('script[data-seo]').forEach((n) => n.remove())
    for (const obj of jsonld ?? []) {
      const s = document.createElement('script')
      s.type = 'application/ld+json'
      s.dataset.seo = '1'
      s.text = JSON.stringify(obj)
      document.head.appendChild(s)
    }
  }, [title, description, canonical, image, noindex, ldKey]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/** Builds the <head> markup for a prerendered page. */
export function headToHtml(h: HeadData): string {
  const img = h.image ? `<meta property="og:image" content="${esc(h.image)}">` : ''
  const ld = (h.jsonld ?? []).map((o) => `<script type="application/ld+json" data-seo="1">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('')
  return [
    `<title>${esc(h.title)}</title>`,
    `<meta name="description" content="${esc(h.description)}">`,
    `<meta name="robots" content="${h.noindex ? 'noindex,follow' : 'index,follow'}">`,
    `<link rel="canonical" href="${esc(h.canonical)}">`,
    `<meta property="og:type" content="website"><meta property="og:site_name" content="${esc(BRAND)}">`,
    `<meta property="og:title" content="${esc(h.title)}"><meta property="og:description" content="${esc(h.description)}"><meta property="og:url" content="${esc(h.canonical)}">`,
    img,
    `<meta name="twitter:card" content="summary_large_image">`,
    ld,
  ].join('')
}

export const canonicalFor = (path: string) => `${DOMAIN}${path === '/' ? '/' : path}`

export const breadcrumbLd = (items: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [{ name: 'Home', path: '/' }, ...items].map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: DOMAIN + it.path })),
})

export const storeLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: BRAND,
  url: DOMAIN + '/',
  logo: DOMAIN + '/favicon.svg',
})
