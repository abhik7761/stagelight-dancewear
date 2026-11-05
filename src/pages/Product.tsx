import { useContext, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Card, Crumbs } from '../components/Card'
import { BRAND, CATS, DOMAIN, config } from '../config'
import { useCart } from '../lib/cart'
import { related, uniqueName } from '../lib/data'
import { imgUrl, money, sentence, slugify, swatchUrl } from '../lib/format'
import { DataCtx } from '../lib/pagedata'
import { Seo, breadcrumbLd, canonicalFor, storeLd } from '../lib/seo'
import { trackAddToCart, trackViewItem } from '../lib/track'
import type { ProductFull } from '../types'
import NotFound from './NotFound'

export default function ProductPage() {
  const { slug = '' } = useParams()
  const ssr = useContext(DataCtx).product
  const [p, setP] = useState<ProductFull | undefined>(ssr?.slug === slug ? ssr : undefined)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (p?.slug === slug) return
    let live = true
    setP(undefined)
    setFailed(false)
    fetch(`/data/p/${slug}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<ProductFull>) : Promise.reject(new Error('not found'))))
      .then((d) => live && setP(d))
      .catch(() => live && setFailed(true))
    return () => {
      live = false
    }
  }, [slug]) // eslint-disable-line react-hooks/exhaustive-deps

  if (failed) return <NotFound />
  if (!p || p.slug !== slug) return <div className="wrap"><p className="empty" aria-busy="true">Loading product...</p></div>
  return <ProductView key={p.slug} p={p} />
}

function ProductView({ p }: { p: ProductFull }) {
  const cart = useCart()
  const [sp] = useSearchParams()
  const first = p.variants.find((v) => v.k === sp.get('variant'))
  const [color, setColor] = useState(first?.c ?? p.colors[0])
  const [size, setSize] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [msg, setMsg] = useState('')
  const [img, setImg] = useState(p.cimgs[first?.c ?? p.colors[0]] ?? p.main)

  const label = CATS[p.cat].label
  const pickColor = (c: string) => {
    setColor(c)
    setSize(null)
    setMsg('')
    if (p.cimgs[c]) setImg(p.cimgs[c])
  }
  const variant = p.variants.find((v) => v.c === color && v.s === size)
  const forColor = p.variants.filter((v) => v.c === color)
  const sizeOk = new Set(forColor.map((v) => v.s))
  const prices = forColor.map((v) => v.p)
  const priceTxt = variant ? money(variant.p) : (Math.min(...prices) !== Math.max(...prices) ? 'From ' : '') + money(Math.min(...prices))

  const thumbs = useMemo(() => [...new Set([p.main, ...Object.values(p.cimgs), ...p.extras])], [p])
  const crumbs = [{ name: 'Shop', path: '/shop' }, { name: label, path: `/shop/${p.cat}` }, ...(p.sub ? [{ name: sentence(p.sub), path: `/shop/${p.cat}/${slugify(p.sub)}` }] : []), { name: p.name, path: `/p/${p.slug}` }]
  const sizesTxt = p.sizes.length > 1 ? `${p.sizes[0][0]}-${p.sizes[p.sizes.length - 1][0]}` : p.sizes[0]?.[0]
  const desc = `${p.name} by ${p.brand}: ${p.colors.length} color${p.colors.length > 1 ? 's' : ''}, sizes ${sizesTxt}. ${p.pmin !== p.pmax ? 'From ' : ''}${money(p.pmin)}. ${config.policies.returnDays}-day returns.`

  useEffect(() => {
    trackViewItem({ id: p.sku, name: p.name, brand: p.brand, variant: '', price: p.pmin, qty: 1 })
  }, [p])

  const navigate = useNavigate()
  const add = (buyNow = false) => {
    if (!variant) {
      setMsg('Choose a size first.')
      return
    }
    cart.add({ k: variant.k, slug: p.slug, name: p.name, brand: p.brand, color: variant.c, size: variant.s, price: variant.p, qty, img: p.cimgs[variant.c] ?? p.main })
    trackAddToCart({ id: variant.k, name: p.name, brand: p.brand, variant: `${variant.c} / ${variant.s}`, price: variant.p, qty })
    setMsg('')
    if (buyNow) navigate('/cart')
  }

  const jsonld = [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.name,
      sku: p.sku,
      brand: { '@type': 'Brand', name: p.brand },
      image: [DOMAIN + imgUrl(p.main)],
      description: p.bullets.join(' ').slice(0, 500) || p.name,
      category: label,
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: config.currency,
        lowPrice: p.pmin.toFixed(2),
        highPrice: p.pmax.toFixed(2),
        offerCount: p.variants.length,
        availability: 'https://schema.org/InStock',
        url: `${DOMAIN}/p/${p.slug}`,
      },
    },
    breadcrumbLd(crumbs),
    storeLd(),
  ]
  const fitTip = p.details.find(([k]) => /suggested fitting/i.test(k))?.[1]
  const details = p.details.filter(([k]) => !/suggested fitting/i.test(k))
  if (p.material && !details.some(([k]) => k.toLowerCase() === 'fabric')) details.push(['Fabric', p.material])
  if (p.country) details.push(['Origin', p.country])
  details.push(['Item number', p.sku])
  const groupsInOrder = ['Child', 'Adult', 'Plus']

  return (
    <>
      <Seo title={`${uniqueName(p)} | ${label} | ${BRAND}`} description={desc} canonical={canonicalFor(`/p/${p.slug}`)} image={DOMAIN + imgUrl(p.main)} jsonld={jsonld} />
      <Crumbs items={crumbs} />
      <div className="wrap">
        <section className="pdp">
          <div className={'gallery' + (thumbs.length > 1 ? '' : ' single')}>
            <div className="thumbs">
              {thumbs.length > 1 &&
                thumbs.map((t, n) => (
                  <button key={t} type="button" aria-label={`Photo ${n + 1}`} aria-current={t === img} onClick={() => setImg(t)}>
                    <img src={imgUrl(t)} alt="" width={78} height={98} loading="lazy" />
                  </button>
                ))}
            </div>
            <div className="mainimg">
              <img src={imgUrl(img)} alt={`${p.name} in ${color}`} width={640} height={800} {...{ fetchpriority: 'high' }} />
            </div>
          </div>
          <div>
            {config.showBrandNames && <div className="brand">{p.brand}</div>}
            <h1>{p.name}</h1>
            <div className="price">{priceTxt}</div>
            <div className="sku">Item {p.sku}</div>

            <div className="opt">
              <div className="opt-l">Color <span>{color}</span></div>
              <div className="colors">
                {p.colors.map((c) => (
                  <button key={c} type="button" aria-pressed={c === color} aria-label={c} title={c} style={{ backgroundImage: `url(${swatchUrl(c)})` }} onClick={() => pickColor(c)} />
                ))}
              </div>
            </div>

            <div className="opt">
              <div className="opt-l">
                Size <span>{size ?? 'Select a size'}</span>
                <Link className="sg" style={{ marginLeft: 'auto' }} to="/size-guide">Size guide</Link>
              </div>
              {groupsInOrder.filter((g) => p.sizes.some(([, sg]) => sg === g)).map((g) => (
                <div key={g} style={{ marginBottom: 10 }}>
                  {p.groups.length > 1 && <div className="note" style={{ marginBottom: 6 }}>{g}</div>}
                  <div className="sizes">
                    {p.sizes.filter(([, sg]) => sg === g).map(([s]) => (
                      <button key={s} type="button" aria-pressed={size === s} disabled={!sizeOk.has(s)} title={sizeOk.has(s) ? s : `${s} - not available in ${color}`} onClick={() => { setSize(s); setMsg('') }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {p.cat === 'shoes' && (
              <p className="legend">Size code = number + scale (C child, Y youth, A adult) + width (N narrow, M medium, W wide). <Link to="/size-guide">How to read sizes</Link></p>
            )}
            {fitTip && <div className="fit"><b>Fit tip:</b> {fitTip}</div>}
            <div className="buy">
              <div className="qty">
                <button type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))}>-</button>
                <input type="number" min={1} max={20} value={qty} aria-label="Quantity" onChange={(e) => setQty(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} />
                <button type="button" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(20, q + 1))}>+</button>
              </div>
              <button className="btn ghost block" type="button" onClick={() => add()}>Add to cart</button>
            </div>
            <button className="btn block buynow" type="button" onClick={() => add(true)}>Buy now</button>
            <div className="msg" role="status">{msg}</div>
            <ul className="perks">
              <li>Ships to {config.policies.shipRegion} - orders leave in {config.policies.processingDays}</li>
              <li>{config.policies.returnDays}-day returns on unworn items</li>
              <li>Not sure of your size? Check the <Link to="/size-guide">size guide</Link></li>
            </ul>
          </div>
        </section>
      </div>
      <div className="wrap">
        <section className="info">
          <div>
            <h2>Details</h2>
            <ul>{p.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
          </div>
          <div>
            <h2>Specifications</h2>
            <dl className="dl">
              {details.map(([k, v]) => (
                <div key={k} style={{ display: 'contents' }}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </div>
      <div className="buybar">
        <div><b>{priceTxt}</b><span>{size ? `${color} / ${size}` : 'Select a size above'}</span></div>
        <button className="btn" type="button" onClick={() => add(true)}>Buy now</button>
      </div>
      <section className="sec tint">
        <div className="wrap">
          <div className="sec-h"><h2>You may also like</h2></div>
          <div className="grid">{related(p).map((q) => <Card key={q.slug} p={q} />)}</div>
        </div>
      </section>
    </>
  )
}
