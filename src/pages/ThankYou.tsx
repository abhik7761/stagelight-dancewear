import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { IcoArrow, IcoBox, IcoChat, IcoCheck } from '../components/Icons'
import { BRAND, config } from '../config'
import { PRODUCTS } from '../lib/data'
import { imgUrl, money } from '../lib/format'
import { loadOrder, markTracked, type PlacedOrder } from '../lib/order'
import { Seo, canonicalFor } from '../lib/seo'
import { trackLead } from '../lib/track'
import { Card } from '../components/Card'

export default function ThankYou() {
  // Read the order after mount so the first client render matches the prerendered HTML.
  const [order, setOrder] = useState<PlacedOrder | null>(null)
  useEffect(() => {
    const o = loadOrder()
    setOrder(o)
    if (o && o.delivered && !o.tracked) {
      trackLead(o.total) // conversion fires once, on this page only
      markTracked(o)
    }
  }, [])

  const picks = PRODUCTS.filter((p) => p.cat === 'shoes' && !/sock|shock|sox/i.test(p.name)).sort((a, b) => b.colors.length - a.colors.length).slice(0, 4)
  const steps: [JSX.Element, string, string][] = [
    [<IcoCheck key="1" />, 'We check stock', 'We confirm every item and size you picked.'],
    [<IcoChat key="2" />, 'You get an email', `We send shipping cost and a secure payment link${order ? ` to ${order.email}` : ''}.`],
    [<IcoBox key="3" />, 'Your order ships', `Orders leave within ${config.policies.processingDays} of payment.`],
  ]

  return (
    <>
      <Seo title={`Thank you | ${BRAND}`} description="Thanks for your order request." canonical={canonicalFor('/thank-you')} noindex />
      <section className="ty-hero">
        <div className="wrap ty-in">
          <div className="ty-tick" aria-hidden="true"><IcoCheck /></div>
          <h1>Thank you{order?.name ? `, ${order.name.split(' ')[0]}` : ''}!</h1>
          <p className="lead">Your order request is in.{order ? ' We will email you shortly.' : ' If you just placed an order, check your email for the next step.'}</p>
          {order && <p className="ty-id">Order number <b data-testid="order-id">{order.id}</b></p>}
        </div>
      </section>

      <div className="wrap">
        <div className="ty-grid">
          <div>
            <h2>What happens next</h2>
            <ol className="ty-steps">
              {steps.map(([ic, h, t]) => (
                <li key={h}>{ic}<div><b>{h}</b><span>{t}</span></div></li>
              ))}
            </ol>
            <p className="note">Questions about your order? <Link to="/contact">Contact us</Link> and mention your order number. Returns follow our <Link to="/returns">{config.policies.returnDays}-day policy</Link>.</p>
          </div>

          {order && (
            <aside className="box">
              <h2 style={{ fontSize: '1.4rem', marginBottom: 10 }}>Your order</h2>
              {order.items.map((i) => (
                <div className="ty-line" key={i.k}>
                  <img src={imgUrl(i.img)} alt="" width={56} height={70} />
                  <div><b>{i.name}</b><span>{i.color} / {i.size} &middot; Qty {i.qty}</span></div>
                  <em>{money(i.price * i.qty)}</em>
                </div>
              ))}
              <div className="row total"><span>Subtotal</span><span>{money(order.total)}</span></div>
              <p className="note">Shipping and taxes are added on your payment link.</p>
              <p className="note">Shipping to: {order.address}</p>
            </aside>
          )}
        </div>

        <div className="ty-more">
          <div className="sec-h"><h2>While you wait</h2><Link className="link-more" to="/shop/shoes">Browse dance shoes</Link></div>
          <div className="grid">{picks.map((p) => <Card key={p.slug} p={p} />)}</div>
          <p className="more-row"><Link className="btn" to="/shop">Continue shopping <IcoArrow /></Link></p>
        </div>
      </div>
    </>
  )
}
