import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Card, Crumbs } from '../components/Card'
import { BRAND, CATS, DOMAIN, config } from '../config'
import { PRODUCTS, inCat, subSlugToName, subsOf } from '../lib/data'
import { imgUrl, money, sentence, slugify } from '../lib/format'
import { Seo, breadcrumbLd, canonicalFor } from '../lib/seo'
import type { CatKey } from '../types'
import NotFound from './NotFound'

const SYM = config.currencySymbol
const BUCKETS: [number, number, string][] = [
  [0, 25, `Under ${SYM}25`],
  [25, 50, `${SYM}25 - ${SYM}50`],
  [50, 100, `${SYM}50 - ${SYM}100`],
  [100, 99999, `${SYM}100 and over`],
]

function toggle<T>(set: Set<T>, v: T): Set<T> {
  const n = new Set(set)
  if (n.has(v)) n.delete(v)
  else n.add(v)
  return n
}

export default function Shop() {
  const { cat, sub } = useParams<{ cat?: string; sub?: string }>()
  const [sp] = useSearchParams()
  // URL filters apply after mount so the first client render matches the prerendered HTML
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const params = mounted ? sp : new URLSearchParams()
  const q = (params.get('q') ?? '').trim().toLowerCase()
  const under = Number(params.get('under')) || 0
  const [brands, setBrands] = useState<Set<string>>(new Set())
  const [groups, setGroups] = useState<Set<string>>(new Set())
  const [prices, setPrices] = useState<Set<number>>(new Set())
  const [sort, setSort] = useState('')
  const [open, setOpen] = useState(false)
  const gParam = params.get('g')
  const bParam = params.get('brand')
  useEffect(() => {
    if (mounted && gParam && ['Child', 'Adult', 'Plus'].includes(gParam)) setGroups(new Set([gParam]))
  }, [mounted, gParam])
  useEffect(() => {
    if (mounted && bParam) setBrands(new Set([bParam]))
  }, [mounted, bParam])

  const catKey = cat as CatKey | undefined
  const validCat = !catKey || catKey in CATS
  const subName = catKey && sub ? subSlugToName(catKey, sub) : undefined
  const base = useMemo(() => {
    let list = catKey ? inCat(catKey) : PRODUCTS
    if (subName) list = list.filter((p) => p.sub === subName)
    if (under) list = list.filter((p) => p.pmin < under)
    if (q) {
      const terms = q.split(/\s+/)
      list = list.filter((p) => {
        const hay = `${p.name} ${p.brand} ${p.sku} ${p.sub} ${p.cat}`.toLowerCase()
        return terms.every((t) => hay.includes(t))
      })
    }
    return list
  }, [catKey, subName, q, under])

  const shown = useMemo(() => {
    let l = base.filter(
      (p) =>
        (!brands.size || brands.has(p.brand)) &&
        (!groups.size || p.groups.some((g) => groups.has(g))) &&
        (!prices.size || [...prices].some((i) => p.pmin >= BUCKETS[i][0] && p.pmin < BUCKETS[i][1])),
    )
    if (sort === 'pa') l = [...l].sort((a, b) => a.pmin - b.pmin)
    if (sort === 'pd') l = [...l].sort((a, b) => b.pmin - a.pmin)
    if (sort === 'na') l = [...l].sort((a, b) => a.name.localeCompare(b.name))
    return l
  }, [base, brands, groups, prices, sort])

  if (!validCat || (sub && !subName)) return <NotFound />

  const brandCount = new Map<string, number>()
  const groupCount = new Map<string, number>()
  for (const p of base) {
    brandCount.set(p.brand, (brandCount.get(p.brand) ?? 0) + 1)
    for (const g of p.groups) groupCount.set(g, (groupCount.get(g) ?? 0) + 1)
  }

  const label = catKey ? CATS[catKey].label : 'All dancewear'
  const h1 = q ? `Results for "${params.get('q')}"` : under ? `Dancewear under ${config.currencySymbol}${under}` : subName ? sentence(subName) : label
  const lowest = base.length ? Math.min(...base.map((p) => p.pmin)) : 0
  const intro = q
    ? `${base.length} matching products.`
    : subName
      ? `${sentence(subName)} in the ${label.toLowerCase()} collection - ${base.length} styles in kids and adult sizes.`
      : catKey
        ? CATS[catKey].blurb
        : `${PRODUCTS.length} dance shoes, leotards, tops, bottoms, tights and accessories in kids and adult sizes.`
  const path = subName && catKey ? `/shop/${catKey}/${slugify(subName)}` : catKey ? `/shop/${catKey}` : '/shop'
  const crumbs = [{ name: 'Shop', path: '/shop' }, ...(catKey ? [{ name: label, path: `/shop/${catKey}` }] : []), ...(subName && catKey ? [{ name: sentence(subName), path }] : [])]
  const title = q ? `Search: ${params.get('q')} | ${BRAND}` : subName ? `${sentence(subName)} - dance ${label.toLowerCase()} | ${BRAND}` : catKey ? `${label} for dancers | ${BRAND}` : `Shop all dancewear | ${BRAND}`
  const desc = (q ? intro : `${intro} ${base.length ? `From ${money(lowest)}.` : ''}`).trim()
  const subs = catKey ? subsOf(catKey) : []

  return (
    <>
      <Seo
        title={title}
        description={desc}
        canonical={canonicalFor(path)}
        image={base[0] ? DOMAIN + imgUrl(base[0].main) : undefined}
        noindex={Boolean(q || under || gParam)}
        jsonld={[
          breadcrumbLd(crumbs),
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: h1,
            url: DOMAIN + path,
            mainEntity: { '@type': 'ItemList', itemListElement: base.slice(0, 50).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${DOMAIN}/p/${p.slug}`, name: p.name })) },
          },
        ]}
      />
      <Crumbs items={crumbs} />
      <div className="wrap">
        <div className={catKey && !q && !under ? 'cat-banner' : 'page-h'}>
          <div>
            <h1>{h1}</h1>
            <p>{intro}</p>
          </div>
          {catKey && !q && !under && base[0] && (
            <div className="arch"><img src={imgUrl(base[0].main)} alt="" width={640} height={800} /></div>
          )}
        </div>
        {subs.length > 1 && !q && (
          <div className="subnav">
            <Link className={'chip' + (!subName ? ' on' : '')} to={`/shop/${catKey}`}>All {label.toLowerCase()}</Link>
            {subs.map((s) => (
              <Link key={s} className={'chip' + (s === subName ? ' on' : '')} to={`/shop/${catKey}/${slugify(s)}`}>{sentence(s)}</Link>
            ))}
          </div>
        )}
        <div className="shop">
          <aside className={'filters' + (open ? ' open' : '')} id="filters" aria-label="Filters">
            {groupCount.size > 0 && (
              <details open>
                <summary>Size group</summary>
                {['Child', 'Adult', 'Plus'].filter((g) => groupCount.has(g)).map((g) => (
                  <label key={g}>
                    <input type="checkbox" checked={groups.has(g)} onChange={() => setGroups(toggle(groups, g))} /> {g}
                    <span className="count">{groupCount.get(g)}</span>
                  </label>
                ))}
              </details>
            )}
            {config.showBrandNames && (
              <details open>
                <summary>Brand</summary>
                {[...brandCount.entries()].sort().map(([b, n]) => (
                  <label key={b}>
                    <input type="checkbox" checked={brands.has(b)} onChange={() => setBrands(toggle(brands, b))} /> {b}
                    <span className="count">{n}</span>
                  </label>
                ))}
              </details>
            )}
            <details open>
              <summary>Price</summary>
              {BUCKETS.map(([, , lbl], i) => (
                <label key={lbl}>
                  <input type="checkbox" checked={prices.has(i)} onChange={() => setPrices(toggle(prices, i))} /> {lbl}
                </label>
              ))}
            </details>
          </aside>
          <div>
            <div className="toolbar">
              <div>
                <button className="btn ghost fbtn" aria-expanded={open} aria-controls="filters" onClick={() => setOpen((o) => !o)}>Filters</button>{' '}
                <span aria-live="polite">{shown.length} products</span>
              </div>
              <label>
                Sort{' '}
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="">Featured</option>
                  <option value="pa">Price: low to high</option>
                  <option value="pd">Price: high to low</option>
                  <option value="na">Name: A to Z</option>
                </select>
              </label>
            </div>
            {shown.length ? (
              <div className="grid">
                {shown.map((p, i) => (
                  <Card key={p.slug} p={p} eager={i < 4} />
                ))}
              </div>
            ) : (
              <p className="empty">No products match. Clear a filter or <Link to="/shop">browse everything</Link>.</p>
            )}
          </div>
        </div>
        {catKey === 'shoes' && !q && !under && <ShoeGuide sub={subName} />}
      </div>
    </>
  )
}

const GUIDE: Record<string, [string, string]> = {
  'ballet slippers': ['Choosing ballet slippers', 'Ballet slippers come in canvas or leather, with a full sole or a split sole. Split soles show off the arch and are popular for class; full soles give extra support to beginners. Most have elastic or drawstring fastening - check each product for its fit tip.'],
  pointe: ['Choosing pointe shoes', 'Pointe shoes are for dancers whose teacher has cleared them for pointe work. Fit matters a great deal, so ask your teacher or a trained fitter, and contact us with any sizing question before you order.'],
  jazz: ['Choosing jazz shoes', 'Jazz shoes are either slip-on or lace-up, usually with a flexible sole that lets you point and turn. Slip-ons are quick to change into; lace-ups give a more secure fit.'],
  'tap and character': ['Choosing tap and character shoes', 'Tap shoes have metal plates on the toe and heel to make the sound; character shoes have a heel and strap for stage and theatre work. Check heel height and width on each product page.'],
  'hip-hop and sneakers': ['Choosing dance sneakers', 'Dance sneakers have flexible soles for floor work and quick footwork. Look for a comfortable fit with room to move, and check whether the style is a low-top or high-top.'],
  'lyrical and contemporary': ['Choosing lyrical and contemporary shoes', 'Half-soles and turners protect the ball of the foot while keeping a barefoot feel for turns and floor work. Fit is usually snug, so follow the fit tip on each product.'],
}

function ShoeGuide({ sub }: { sub?: string }) {
  const g = sub ? GUIDE[sub] : undefined
  return (
    <section className="seo-copy" aria-label="Dance shoe buying guide">
      <h2>{g ? g[0] : 'How to choose dance shoes'}</h2>
      <p>{g ? g[1] : 'The right dance shoe depends on your class: ballet slippers for ballet, jazz shoes for jazz, tap shoes for tap, sneakers for hip-hop and half-soles for lyrical and contemporary. Browse by style above, then filter by size group, brand and price.'}</p>
      <p>
        Shoe sizes are written as a number, a scale letter (C child, Y youth, A adult) and a width (N narrow, M medium, W wide) - for example 8AM is size 8, adult scale, medium width. Read the <Link to="/size-guide">size guide</Link> for measuring tips, or <Link to="/contact">contact us</Link> if you are between sizes.
      </p>
    </section>
  )
}
