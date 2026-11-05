import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BRAND, config } from '../config'
import { sendForm } from '../lib/forms'
import { money } from '../lib/format'
import { Seo, breadcrumbLd, canonicalFor } from '../lib/seo'
import NotFound from './NotFound'

const pol = config.policies
const c = config.contact
const reach: ReactNode = c.email ? <a href={`mailto:${c.email}`}>{c.email}</a> : <Link to="/contact">our contact form</Link>

interface Page { title: string; desc: string; body: ReactNode }
const PAGES: Record<string, Page> = {
  about: {
    title: `About ${BRAND}`,
    desc: `About ${BRAND}: dance shoes and dancewear for kids and adults.`,
    body: (
      <>
        <p>{BRAND} sells dance shoes, leotards, tops, bottoms, tights and accessories for ballet, jazz, tap, hip-hop, lyrical and gymnastics.</p>
        <p>We list only styles that are in stock, show every available color and size, and answer sizing questions before you order.</p>
        <p>Questions? Reach us through {reach}.</p>
      </>
    ),
  },
  shipping: {
    title: 'Shipping',
    desc: `Shipping information for ${BRAND} orders.`,
    body: (
      <>
        <p>We ship to {pol.shipRegion}. Orders are processed within {pol.processingDays}.</p>
        <h2>How ordering works</h2>
        <ul>
          <li>Add items to your cart and send an order request.</li>
          <li>We confirm stock, shipping cost and delivery time by email.</li>
          <li>You pay through a secure payment link we send you; your order ships after payment.</li>
        </ul>
        {pol.freeShippingOver > 0 && <p>Orders over {money(pol.freeShippingOver)} ship free.</p>}
        <p>Last updated {pol.lastUpdated}.</p>
      </>
    ),
  },
  returns: {
    title: 'Returns & exchanges',
    desc: `Returns and exchanges policy for ${BRAND}.`,
    body: (
      <>
        <p>You can return or exchange unworn items in original condition within {pol.returnDays} days of delivery.</p>
        <h2>How to return</h2>
        <ul>
          <li>Contact us through {reach} with your order details.</li>
          <li>We reply with return instructions.</li>
          <li>Refunds go back to the original payment method after we receive and inspect the item.</li>
        </ul>
        <h2>Not returnable</h2>
        <ul>
          <li>Items that have been worn, washed or altered.</li>
          <li>Undergarments and hosiery once opened, for hygiene reasons.</li>
        </ul>
        <p>Last updated {pol.lastUpdated}.</p>
      </>
    ),
  },
  privacy: {
    title: 'Privacy policy',
    desc: `How ${BRAND} collects and uses your data.`,
    body: (
      <>
        <p>{BRAND} respects your privacy. This page explains what we collect and why.</p>
        <h2>What we collect</h2>
        <ul>
          <li>Order details you send us: name, email, phone and shipping address.</li>
          <li>Messages you send through the contact form.</li>
          <li>With your consent: analytics and advertising cookies (Google Analytics, Google Ads, Microsoft Advertising).</li>
        </ul>
        <h2>How we use it</h2>
        <ul>
          <li>To confirm, fulfil and support your orders.</li>
          <li>To measure site traffic and the performance of our ads.</li>
        </ul>
        <h2>Your choices</h2>
        <p>You can decline cookies in the banner or change your choice any time with "Cookie preferences" in the footer. To request access to or deletion of your data, contact {reach}.</p>
        <p>We do not sell your personal information. Last updated {pol.lastUpdated}.</p>
      </>
    ),
  },
  terms: {
    title: 'Terms of sale',
    desc: `Terms of sale for ${BRAND}.`,
    body: (
      <>
        <ul>
          <li>Prices are shown in {config.currency} and may change before your order is confirmed.</li>
          <li>An order request is not a contract until we confirm it and you pay the payment link.</li>
          <li>We may cancel and refund an order if an item is unavailable.</li>
          <li>Returns follow our <Link to="/returns">returns policy</Link>.</li>
          <li>Product names and brands belong to their owners.</li>
        </ul>
        <p>Last updated {pol.lastUpdated}.</p>
      </>
    ),
  },
  'size-guide': {
    title: 'Size guide',
    desc: `How to measure and read dance shoe and dancewear sizes at ${BRAND}.`,
    body: (
      <>
        <p>Fit varies by brand and style, so check the product details. If you are between sizes, size up for comfort or contact us.</p>
        <h2>How to read our shoe sizes</h2>
        <p>Shoe sizes are written as a number, a scale letter and a width, for example <b>8AM</b> or <b>10CM</b>.</p>
        <table>
          <thead><tr><th>Part</th><th>Meaning</th></tr></thead>
          <tbody>
            <tr><td>Number</td><td>The size (7, 7.5, 8 ...)</td></tr>
            <tr><td>C, Y or A</td><td>Scale: C = child, Y = youth, A = adult</td></tr>
            <tr><td>N, M, W</td><td>Width: narrow, medium, wide (X = extra wide)</td></tr>
            <tr><td>AA, B, C, D, E</td><td>Letter widths - the later the letter, the wider the shoe</td></tr>
          </tbody>
        </table>
        <p>So 8AM is size 8, adult scale, medium width. 10CM is size 10, child scale, medium width.</p>
        <h2>How to read our clothing sizes</h2>
        <table>
          <thead><tr><th>Code</th><th>Meaning</th></tr></thead>
          <tbody>
            <tr><td>T</td><td>Toddler</td></tr>
            <tr><td>XSC, SC, MC, LC, XLC</td><td>Child sizes (C = child; X = extra)</td></tr>
            <tr><td>IC</td><td>Intermediate child - between child and adult</td></tr>
            <tr><td>XSA, SA, MA, LA, XLA</td><td>Adult sizes (A = adult)</td></tr>
            <tr><td>XXL, 2X, 3X</td><td>Plus sizes</td></tr>
          </tbody>
        </table>
        <h2>Measuring tips</h2>
        <ul>
          <li>Feet: stand on paper, mark heel and longest toe, and measure the distance.</li>
          <li>Bust, waist and hips: measure over thin clothing, tape snug but not tight.</li>
          <li>Torso (leotards): measure from shoulder over the crotch and back to the same shoulder.</li>
        </ul>
      </>
    ),
  },
}
export const INFO_SLUGS = Object.keys(PAGES)

export function InfoPage({ slug: forced }: { slug?: string }) {
  const params = useParams()
  const slug = forced ?? params.slug ?? ''
  const page = PAGES[slug]
  if (!page) return <NotFound />
  const path = `/${slug}`
  return (
    <>
      <Seo title={`${page.title} | ${BRAND}`} description={page.desc} canonical={canonicalFor(path)} jsonld={[breadcrumbLd([{ name: page.title, path }])]} />
      <div className="wrap">
        <div className="page-h"><h1>{page.title}</h1></div>
        <div className="prose">{page.body}</div>
      </div>
    </>
  )
}

export function Contact() {
  const [busy, setBusy] = useState(false)
  const [res, setRes] = useState<{ ok: boolean; text: string } | null>(null)
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    if (f.get('botcheck')) return
    setBusy(true)
    const r = await sendForm('Contact message', { name: String(f.get('name')), email: String(f.get('email')), message: String(f.get('message')) })
    setBusy(false)
    setRes(r.ok ? { ok: true, text: r.fallback ? 'Your email app opened - send the email to finish.' : 'Thanks - we will reply by email.' } : { ok: false, text: r.error ?? 'Something went wrong.' })
    if (r.ok && !r.fallback) e.currentTarget.reset()
  }
  return (
    <>
      <Seo title={`Contact us | ${BRAND}`} description={`Contact ${BRAND} about sizing, stock or your order.`} canonical={canonicalFor('/contact')} jsonld={[breadcrumbLd([{ name: 'Contact us', path: '/contact' }])]} />
      <div className="wrap">
        <div className="page-h">
          <h1>Contact us</h1>
          <p>Questions about sizing, stock or an order? Send a message and we will reply by email.</p>
        </div>
        <div className="cart-grid">
          <form className="form" onSubmit={submit}>
            <label>Name<input name="name" required autoComplete="name" /></label>
            <label>Email<input name="email" type="email" required autoComplete="email" /></label>
            <label>Message<textarea name="message" required /></label>
            <input className="hp" name="botcheck" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <button className="btn" type="submit" disabled={busy}>{busy ? 'Sending...' : 'Send message'}</button>
            {res && <div className={res.ok ? 'ok' : 'err'} role="status">{res.text}</div>}
          </form>
          <aside className="box">
            <h2 style={{ fontSize: '1.4rem', marginBottom: 10 }}>Details</h2>
            <p>{c.email ? <a href={`mailto:${c.email}`}>{c.email}</a> : 'Use the form and we will reply by email.'}</p>
            {c.showPhone && c.phone && <p>Phone: {c.phone}</p>}
            {c.address && <p>{c.address}</p>}
            <p className="note">Hours: {c.hours}</p>
          </aside>
        </div>
      </div>
    </>
  )
}
