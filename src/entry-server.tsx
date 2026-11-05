import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import App from './App'
import { CAT_KEYS } from './config'
import { CartProvider } from './lib/cart'
import { PRODUCTS, subsOf } from './lib/data'
import { slugify } from './lib/format'
import { DataCtx } from './lib/pagedata'
import { HeadCtx, headToHtml, type HeadCollector } from './lib/seo'
import { INFO_SLUGS } from './pages/Info'
import type { PageData } from './types'

export function render(url: string, data: PageData = {}) {
  const collector: HeadCollector = { data: null }
  const html = renderToString(
    <HeadCtx.Provider value={collector}>
      <DataCtx.Provider value={data}>
        <StaticRouter location={url} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <CartProvider>
            <App />
          </CartProvider>
        </StaticRouter>
      </DataCtx.Provider>
    </HeadCtx.Provider>,
  )
  return { html, head: collector.data ? headToHtml(collector.data) : '' }
}

/** Every URL that gets a static HTML file, with a flag for the ones that should appear in sitemap.xml. */
export function routes() {
  const list: { url: string; sitemap: boolean; product?: string }[] = [{ url: '/', sitemap: true }, { url: '/shop', sitemap: true }]
  for (const c of CAT_KEYS) {
    if (!PRODUCTS.some((p) => p.cat === c)) continue
    list.push({ url: `/shop/${c}`, sitemap: true })
    const subs = subsOf(c)
    if (subs.length > 1) for (const s of subs) list.push({ url: `/shop/${c}/${slugify(s)}`, sitemap: true })
  }
  for (const p of PRODUCTS) list.push({ url: `/p/${p.slug}`, sitemap: true, product: p.slug })
  for (const s of INFO_SLUGS) list.push({ url: `/${s}`, sitemap: true })
  list.push({ url: '/contact', sitemap: true }, { url: '/cart', sitemap: false }, { url: '/thank-you', sitemap: false })
  return list
}
