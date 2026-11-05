import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../components/Card'
import { IcoArrow, IcoBox, IcoCheck, IcoReturn, IcoRuler } from '../components/Icons'
import { BRAND, CATS, DOMAIN, config } from '../config'
import { PRODUCTS, inCat } from '../lib/data'
import { imgUrl, money, priceLabel, slugify } from '../lib/format'
import { Seo, canonicalFor, storeLd } from '../lib/seo'
import type { ProductLite } from '../types'

const pol = config.policies
const S = config.currencySymbol
const byColors = (a: ProductLite, b: ProductLite) => b.colors.length - a.colors.length
const isSock = (p: ProductLite) => /sock|shock|sox/i.test(p.name)

const STYLES: { label: string; sub: string; note: string }[] = [
  { label: 'Ballet', sub: 'ballet slippers', note: 'Canvas and leather slippers' },
  { label: 'Pointe', sub: 'pointe', note: 'Pointe shoes for trained dancers' },
  { label: 'Jazz', sub: 'jazz', note: 'Slip-on and lace-up jazz shoes' },
  { label: 'Tap & character', sub: 'tap and character', note: 'Tap, Mary Jane and heels' },
  { label: 'Hip-hop & sneakers', sub: 'hip-hop and sneakers', note: 'Dance sneakers in every color' },
  { label: 'Lyrical & contemporary', sub: 'lyrical and contemporary', note: 'Half-soles and turners' },
]

const FAQ: [string, string][] = [
  ['How do I choose the right dance shoe?', 'Start with your class: ballet slippers for ballet, jazz shoes for jazz, tap shoes for tap, and sneakers for hip-hop. Each style has its own page with sizes and widths. If you are unsure, ask your teacher or contact us.'],
  ['How do I read a shoe size like 8AM?', 'The number is the size, the first letter is the scale (C child, Y youth, A adult) and the last letter is the width (N narrow, M medium, W wide). So 8AM is size 8, adult scale, medium width.'],
  ['Do shoes run true to size?', 'It depends on the shoe. Every product page has a fit tip, for example whether to order your street size or size up. If you are between sizes, contact us before ordering.'],
  ['Do you sell kids dance shoes?', 'Yes. Most styles come in child sizes. Use the Kids filter on the shoes page to see only child-size shoes.'],
  ['How does ordering work?', 'Add items to your cart and send an order request. We confirm stock and shipping by email and send a secure payment link. Your order ships after payment.'],
  ['What is your return policy?', `Unworn items can be returned or exchanged within ${pol.returnDays} days of delivery. Opened hosiery and undergarments cannot be returned.`],
  ['How long does shipping take?', `Orders are processed within ${pol.processingDays} and ship to ${pol.shipRegion}. We confirm the delivery time when we reply to your order request.`],
]

export default function Home() {
  const shoes = inCat('shoes').filter((p) => !isSock(p))
  const [style, setStyle] = useState<string>('all')

  const pick = (list: ProductLite[]): ProductLite | undefined => [...list].sort(byColors)[0]
  const sub = (s: string, re?: RegExp) => pick(shoes.filter((p) => p.sub === s && (!re || re.test(p.name))))
  const hero = [sub('ballet slippers'), sub('tap and character', /character|tap/i), sub('hip-hop and sneakers', /sneaker/i)].filter((p): p is ProductLite => Boolean(p))

  const lowest = Math.min(...shoes.map((p) => p.pmin))
  const best = [...(style === 'all' ? shoes : shoes.filter((p) => p.sub === style))].sort(byColors).slice(0, 8)
  const brandCounts = [...shoes.reduce((m, p) => m.set(p.brand, (m.get(p.brand) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]).filter(([, n]) => n >= 2)
  const kids = shoes.filter((p) => p.groups.includes('Child'))
  const adult = shoes.filter((p) => p.groups.includes('Adult'))
  const kidsPick = pick(kids.filter((p) => p.groups.length === 1)) ?? pick(kids)
  const adultPick = pick(adult.filter((p) => p.sub !== 'ballet slippers')) ?? pick(adult)
  const under = [...shoes.filter((p) => p.pmin < 30)].sort(byColors).slice(0, 4)
  const more = (['leotards', 'tights', 'tops', 'bottoms'] as const).map((k) => ({ k, first: pick(inCat(k).filter((p) => !isSock(p))), n: inCat(k).length }))
  const brands = [...new Set(PRODUCTS.map((p) => p.brand))].sort()

  const strip: [JSX.Element, string, string][] = [
    [<IcoRuler key="r" />, 'Kids to plus sizes', 'Widths from narrow to wide'],
    [<IcoReturn key="t" />, `${pol.returnDays}-day returns`, 'On unworn items'],
    [<IcoBox key="b" />, `Ships in ${pol.processingDays}`, `To ${pol.shipRegion}`],
    [<IcoCheck key="c" />, 'In-stock styles only', 'Discontinued shoes removed'],
  ]

  return (
    <>
      <Seo
        title={`Dance shoes, leotards and dancewear | ${BRAND}`}
        description={`Shop ${shoes.length} dance shoes - ballet, pointe, jazz, tap, hip-hop and lyrical - plus leotards, tights and dancewear in kids and adult sizes. Shoes from ${money(lowest)}.`}
        canonical={canonicalFor('/')}
        image={hero[0] ? `${DOMAIN}${imgUrl(hero[0].main)}` : undefined}
        jsonld={[
          storeLd(),
          { '@context': 'https://schema.org', '@type': 'WebSite', name: BRAND, url: DOMAIN + '/', potentialAction: { '@type': 'SearchAction', target: `${DOMAIN}/shop?q={search_term_string}`, 'query-input': 'required name=search_term_string' } },
          { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
        ]}
      />

      <section className="hero">
        <div className="wrap hero-in">
          <div className="hero-copy">
            <h1>Dance shoes for every class, recital and competition</h1>
            <p className="lead">Ballet, jazz, tap, hip-hop and lyrical shoes in child, adult and plus sizes. {shoes.length} styles in stock, from {money(lowest)}.</p>
            <div className="hero-cta">
              <Link className="btn" to="/shop/shoes">Shop dance shoes <IcoArrow /></Link>
              <Link className="btn ghost" to="/size-guide">Find my size</Link>
            </div>
            <div className="who" role="group" aria-label="Shop shoes by size group">
              <span>Shoes for:</span>
              <Link to="/shop/shoes?g=Child">Kids</Link>
              <Link to="/shop/shoes?g=Adult">Adult</Link>
              <Link to="/shop/shoes?g=Plus">Plus</Link>
            </div>
          </div>
          <div className="hero-art">
            {hero.map((p, i) => (
              <Link className="arch has-cap" key={p.slug} to={`/p/${p.slug}`} aria-label={`${p.name}, ${priceLabel(p)}`}>
                <img src={imgUrl(p.main)} alt={p.name} width={640} height={800} loading={i === 0 ? 'eager' : 'lazy'} {...(i === 0 ? { fetchpriority: 'high' } : {})} />
                <span className="cap"><b>{p.name}</b>{priceLabel(p)}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="strip" aria-label="Why shop with us">
        <div className="wrap strip-in">
          {strip.map(([ic, h, t]) => (
            <div key={h}>{ic}<div><b>{h}</b><span>{t}</span></div></div>
          ))}
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="sec-h">
            <div><h2>Find your dance shoe</h2><p>Pick the shoe for your class. Each style has its own page with sizes and widths.</p></div>
            <Link className="link-more" to="/shop/shoes">All {shoes.length} dance shoes</Link>
          </div>
          <div className="style-tiles">
            {STYLES.map((s) => {
              const list = shoes.filter((p) => p.sub === s.sub)
              const first = pick(list)
              if (!first) return null
              return (
                <Link className="stile" key={s.sub} to={`/shop/shoes/${slugify(s.sub)}`}>
                  <img src={imgUrl(first.main)} alt="" width={640} height={800} loading="lazy" />
                  <span>
                    <b>{s.label}</b>
                    <small>{s.note}</small>
                    <em>{list.length} styles from {money(Math.min(...list.map((p) => p.pmin)))}</em>
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="sec tint">
        <div className="wrap">
          <div className="sec-h">
            <div><h2>Best-selling dance shoes</h2><p>The shoes with the most color choices. Filter by style.</p></div>
            <div className="tabs" role="tablist" aria-label="Shoe style">
              <button role="tab" aria-selected={style === 'all'} className={style === 'all' ? 'on' : ''} onClick={() => setStyle('all')}>All</button>
              {STYLES.slice(0, 5).map((s) => (
                <button key={s.sub} role="tab" aria-selected={style === s.sub} className={style === s.sub ? 'on' : ''} onClick={() => setStyle(s.sub)}>{s.label.split(' ')[0]}</button>
              ))}
            </div>
          </div>
          <div className="grid">{best.map((p) => <Card key={p.slug} p={p} />)}</div>
          <p className="more-row">
            <Link className="btn ghost" to={style === 'all' ? '/shop/shoes' : `/shop/shoes/${slugify(style)}`}>
              See all {style === 'all' ? 'dance shoes' : (STYLES.find((s) => s.sub === style)?.label.toLowerCase() ?? '') + ' shoes'} <IcoArrow />
            </Link>
          </p>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="sec-h"><div><h2>Dance shoes by brand</h2><p>Browse the shoe brands we stock.</p></div></div>
          <div className="brand-tiles">
            {brandCounts.map(([b, n]) => (
              <Link key={b} className="btile" to={`/shop/shoes?brand=${encodeURIComponent(b)}`}>
                <b>{b}</b><small>{n} shoes</small><IcoArrow />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {kidsPick && adultPick && (
        <section className="sec tint">
          <div className="wrap split">
            <Link className="panel" to="/shop/shoes?g=Child">
              <div><h2>Kids dance shoes</h2><p>{kids.length} shoes in child sizes, from toddler to big kid.</p><span className="btn">Shop kids shoes <IcoArrow /></span></div>
              <img src={imgUrl(kidsPick.main)} alt="" width={640} height={800} loading="lazy" />
            </Link>
            <Link className="panel alt" to="/shop/shoes?g=Adult">
              <div><h2>Adult dance shoes</h2><p>{adult.length} shoes in adult sizes, many in multiple widths.</p><span className="btn">Shop adult shoes <IcoArrow /></span></div>
              <img src={imgUrl(adultPick.main)} alt="" width={640} height={800} loading="lazy" />
            </Link>
          </div>
        </section>
      )}

      <section className="sec">
        <div className="wrap fit-wrap">
          <div>
            <h2>Get the fit right</h2>
            <p className="fit-lead">Dance shoe sizes pack three facts into one code. Read it once and every product page makes sense.</p>
            <div className="code" role="img" aria-label="Example shoe size code 8AM: size 8, adult scale, medium width">
              <span><i>8</i><small>Size</small></span>
              <span><i>A</i><small>Scale</small></span>
              <span><i>M</i><small>Width</small></span>
            </div>
            <ul className="code-key">
              <li><b>Scale:</b> C child, Y youth, A adult</li>
              <li><b>Width:</b> N narrow, M medium, W wide</li>
            </ul>
            <Link className="btn ghost" to="/size-guide">Read the full size guide <IcoArrow /></Link>
          </div>
          <div className="tips">
            <div><h3>Check the fit tip</h3><p>Every shoe page shows the maker's fit advice, such as ordering your street size or sizing up.</p></div>
            <div><h3>Measure both feet</h3><p>Measure heel to longest toe in the evening and fit the larger foot.</p></div>
            <div><h3>Pick the right width</h3><p>Where a shoe comes in several widths, the size buttons show only what is in stock.</p></div>
            <div><h3>Not sure? Ask first</h3><p>Pointe shoes in particular are best fitted with your teacher's guidance. <Link to="/contact">Contact us</Link> with any sizing question.</p></div>
          </div>
        </div>
      </section>

      {under.length > 0 && (
        <section className="sec tint">
          <div className="wrap">
            <div className="sec-h">
              <div><h2>Dance shoes under <span className="num">{S}30</span></h2><p>Class-ready shoes that will not stretch the budget.</p></div>
              <Link className="link-more" to="/shop/shoes?under=30">See all shoes under {S}30</Link>
            </div>
            <div className="grid">{under.map((p) => <Card key={p.slug} p={p} />)}</div>
          </div>
        </section>
      )}

      <section className="sec">
        <div className="wrap">
          <div className="sec-h"><div><h2>Complete the look</h2><p>Leotards, tights and more to go with your shoes.</p></div><Link className="link-more" to="/shop">Shop all dancewear</Link></div>
          <div className="arches four">
            {more.map(({ k, first, n }) => first && (
              <Link className="tile" to={`/shop/${k}`} key={k}>
                <div className="arch"><img src={imgUrl(first.main)} alt="" width={640} height={800} loading="lazy" /></div>
                <b>{CATS[k].label}</b><small>{n} styles</small>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="sec tint">
        <div className="wrap faq-wrap">
          <div><h2>Questions before you order</h2><p className="note" style={{ marginTop: 10 }}>Still unsure? <Link to="/contact">Send us a message</Link> and we will help you pick.</p></div>
          <div className="faq">
            {FAQ.map(([q, a], i) => (
              <details key={q} {...(i === 0 ? { open: true } : {})}><summary>{q}</summary><p>{a}</p></details>
            ))}
          </div>
        </div>
      </section>

      {config.showBrandNames && (
        <section className="sec">
          <div className="wrap">
            <div className="sec-h"><h2>Brands we stock</h2></div>
            <div className="brands-row">{brands.map((b) => <span key={b}>{b}</span>)}</div>
          </div>
        </section>
      )}

      <section className="cta-band">
        <div className="wrap cta-in">
          <h2>Find the shoe for your next class</h2>
          <div className="hero-cta">
            <Link className="btn light" to="/shop/shoes">Shop dance shoes <IcoArrow /></Link>
            <Link className="btn ghost-light" to="/size-guide">Check the size guide</Link>
          </div>
        </div>
      </section>
    </>
  )
}
