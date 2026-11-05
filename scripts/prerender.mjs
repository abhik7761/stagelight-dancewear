// Static prerender: turns every route into real HTML (with SEO head tags + data for hydration), then writes sitemap.xml and robots.txt.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = process.cwd()
const dist = path.join(root, 'dist')
const config = JSON.parse(fs.readFileSync(path.join(root, 'site.config.json'), 'utf8'))
const domain = config.domain.replace(/\/$/, '')
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
const { render, routes } = await import(pathToFileURL(path.join(root, 'dist-server', 'entry-server.js')).href)

// function replacers: html/head contain "$" (prices) which String.replace would otherwise treat as patterns
const fill = (head, html, data, url = '') =>
  template
    .replace('<div id="root">', () => `<div id="root" data-path="${url}">`)
    .replace('<!--app-head-->', () => head)
    .replace('<!--app-html-->', () => html)
    .replace('<!--app-data-->', () => data ? `<script>window.__DATA__=${JSON.stringify(data).replace(/</g, '\\u003c')}</script>` : '')

const write = (file, content) => {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content)
}

const list = routes()
let count = 0
for (const r of list) {
  const data = r.product ? { product: JSON.parse(fs.readFileSync(path.join(root, 'public', 'data', 'p', `${r.product}.json`), 'utf8')) } : {}
  const { html, head } = render(r.url, data)
  const file = r.url === '/' ? path.join(dist, 'index.html') : path.join(dist, r.url.slice(1), 'index.html')
  write(file, fill(head, html, r.product ? data : null, r.url))
  count++
}
// 404 page
{
  const { html, head } = render('/this-page-does-not-exist-404')
  write(path.join(dist, '404.html'), fill(head, html, null, '/__404__'))
}

if (!config.forms.web3formsKey) {
  console.warn('!! WARNING: forms.web3formsKey is empty - order requests and contact messages are NOT delivered to ' + (config.forms.leadEmail || 'any inbox') + '. Add a Web3Forms key (and set demoMode to false) before going live.')
}

const today = new Date().toISOString().slice(0, 10)
write(
  path.join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    list.filter((r) => r.sitemap).map((r) => `<url><loc>${domain}${r.url === '/' ? '/' : r.url}</loc><lastmod>${today}</lastmod></url>`).join('\n') +
    `\n</urlset>\n`,
)
write(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /cart\nDisallow: /thank-you\nDisallow: /shop?q=\n\nSitemap: ${domain}/sitemap.xml\n`)
console.log(`prerendered ${count} pages + 404, sitemap with ${list.filter((r) => r.sitemap).length} URLs`)
