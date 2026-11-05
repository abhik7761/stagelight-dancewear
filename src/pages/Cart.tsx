import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BRAND } from '../config'
import { useCart } from '../lib/cart'
import { sendForm } from '../lib/forms'
import { imgUrl, money } from '../lib/format'
import { saveOrder } from '../lib/order'
import { Seo, canonicalFor } from '../lib/seo'
import { trackBeginCheckout } from '../lib/track'

export default function Cart() {
  const cart = useCart()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)
  const [started, setStarted] = useState(false)

  const begin = () => {
    if (started || !cart.items.length) return
    setStarted(true)
    trackBeginCheckout(cart.items.map((i) => ({ id: i.k, name: i.name, brand: i.brand, variant: `${i.color} / ${i.size}`, price: i.price, qty: i.qty })), cart.subtotal)
  }

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    if (f.get('botcheck')) return
    if (!cart.items.length) return
    setBusy(true)
    const orderId = 'DW-' + Date.now().toString(36).toUpperCase().slice(-6)
    const snapshot = [...cart.items]
    const total = cart.subtotal
    const lines = snapshot.map((i) => `${i.qty} x ${i.name} (${i.brand}) - ${i.color} / ${i.size} - ${money(i.price)} each [${i.k}]`).join('\n')
    const r = await sendForm('New order request ' + orderId, {
      order_id: orderId,
      name: String(f.get('name') ?? ''),
      email: String(f.get('email') ?? ''),
      phone: String(f.get('phone') ?? ''),
      address: String(f.get('address') ?? ''),
      notes: String(f.get('notes') ?? ''),
      items: lines,
      subtotal: money(total),
    })
    setBusy(false)
    if (!r.ok) {
      setResult({ ok: false, text: r.error ?? 'Something went wrong.' })
      return
    }
    if (r.fallback) {
      setResult({ ok: true, text: 'Your email app opened with the order details - send the email to finish.' })
      return
    }
    saveOrder({ id: orderId, items: snapshot, total, name: String(f.get('name') ?? ''), email: String(f.get('email') ?? ''), address: String(f.get('address') ?? ''), delivered: !r.demo })
    cart.clear()
    navigate('/thank-you')
  }

  return (
    <>
      <Seo title={`Your cart | ${BRAND}`} description="Review your cart and send your order request." canonical={canonicalFor('/cart')} noindex />
      <div className="wrap">
        <div className="page-h"><h1>Your cart</h1></div>
        <div className="cart-grid">
          <div aria-live="polite">
            {cart.items.length === 0 && (
              <p className="empty">Your cart is empty. <Link to="/shop">Browse dancewear</Link> to add something.</p>
            )}
            {cart.items.map((i) => (
              <div className="line" key={i.k}>
                <img src={imgUrl(i.img)} alt="" width={90} height={112} />
                <div>
                  <h3><Link to={`/p/${i.slug}`}>{i.name}</Link></h3>
                  <div className="meta">{i.color} / {i.size} &middot; {money(i.price)}</div>
                  <button className="rm" onClick={() => cart.remove(i.k)}>Remove</button>
                </div>
                <div>
                  <div className="qty">
                    <button type="button" aria-label="Decrease quantity" onClick={() => cart.setQty(i.k, i.qty - 1)}>-</button>
                    <input type="number" value={i.qty} min={1} max={20} aria-label={`Quantity for ${i.name}`} onChange={(e) => cart.setQty(i.k, Number(e.target.value) || 1)} />
                    <button type="button" aria-label="Increase quantity" onClick={() => cart.setQty(i.k, i.qty + 1)}>+</button>
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: 700, marginTop: 8 }}>{money(i.price * i.qty)}</div>
                </div>
              </div>
            ))}
          </div>
          <aside className="box">
            <h2 style={{ fontSize: '1.4rem', marginBottom: 14 }}>Order summary</h2>
            <div className="row"><span>Items</span><span>{cart.count}</span></div>
            <div className="row total"><span>Subtotal</span><span>{money(cart.subtotal)}</span></div>
            <p className="note">Shipping and any taxes are confirmed when we reply to your request.</p>
            {result && <div className={result.ok ? 'ok' : 'err'} role="status" style={{ margin: '12px 0' }}>{result.text}</div>}
            {cart.items.length > 0 && (
              <form className="form" onSubmit={submit} onFocus={begin}>
                <label>Full name<input name="name" required autoComplete="name" /></label>
                <div className="two">
                  <label>Email<input name="email" type="email" required autoComplete="email" /></label>
                  <label>Phone<input name="phone" type="tel" autoComplete="tel" /></label>
                </div>
                <label>Shipping address<textarea name="address" required autoComplete="street-address" style={{ minHeight: 80 }} /></label>
                <label>Notes (optional)<textarea name="notes" style={{ minHeight: 70 }} /></label>
                <input className="hp" name="botcheck" tabIndex={-1} autoComplete="off" aria-hidden="true" />
                <button className="btn block" type="submit" disabled={busy}>{busy ? 'Sending...' : 'Send order request'}</button>
                <p className="note">We check stock, confirm shipping and send a secure payment link by email. You are not charged until you pay that link.</p>
              </form>
            )}
          </aside>
        </div>
      </div>
    </>
  )
}
