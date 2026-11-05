import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { BRAND, CATS, CAT_KEYS, config } from '../config'
import { useCart } from '../lib/cart'
import { search, subsOf } from '../lib/data'
import { imgUrl, priceLabel, sentence, slugify } from '../lib/format'
import { getConsent, setConsent } from '../lib/track'
import { BagIcon, LogoMark, MenuIcon, SearchIcon } from './Logo'

function Header() {
  const { count } = useCart()
  const nav = useNavigate()
  const loc = useLocation()
  const [menu, setMenu] = useState(false)
  const [sopen, setSopen] = useState(false)
  const [q, setQ] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const hits = q.trim().length > 1 ? search(q) : []

  useEffect(() => {
    setMenu(false)
    setSopen(false)
    setQ('')
  }, [loc.pathname])
  useEffect(() => {
    if (sopen) input.current?.focus()
  }, [sopen])

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <div className="announce">{config.announcement}</div>
      <header className="hdr">
        <div className="wrap hdr-in">
          <button className="ibtn menu-btn" aria-label="Menu" aria-expanded={menu} aria-controls="nav" onClick={() => setMenu((m) => !m)}>
            <MenuIcon />
          </button>
          <Link className="logo" to="/">
            <LogoMark />
            <span>{BRAND}</span>
          </Link>
          <nav className={'nav' + (menu ? ' open' : '')} id="nav" aria-label="Main">
            {CAT_KEYS.map((k) => (
              <NavLink key={k} to={`/shop/${k}`} className={k === 'shoes' ? 'hot' : undefined}>{CATS[k].label}</NavLink>
            ))}
          </nav>
          <div className="hdr-tools">
            <button className="ibtn" aria-label="Search" aria-expanded={sopen} onClick={() => setSopen((o) => !o)}>
              <SearchIcon />
            </button>
            <Link className="ibtn" to="/cart" aria-label={`Cart, ${count} items`}>
              <BagIcon />
              <span className="badge">{count > 0 ? count : ''}</span>
            </Link>
          </div>
        </div>
        <div className="shoebar">
          <div className="wrap shoebar-in" aria-label="Dance shoes by style">
            <span>Dance shoes:</span>
            {subsOf('shoes').map((s) => (
              <Link key={s} to={`/shop/shoes/${slugify(s)}`}>{sentence(s)}</Link>
            ))}
            <Link className="alt" to="/shop/shoes?g=Child">Kids shoes</Link>
            <Link className="alt" to="/shop/shoes?g=Adult">Adult shoes</Link>
          </div>
        </div>
        <div className={'search-bar' + (sopen ? ' open' : '')}>
          <div className="wrap">
            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault()
                if (q.trim()) nav(`/shop?q=${encodeURIComponent(q.trim())}`)
              }}
            >
              <label className="sr" htmlFor="sq">Search products</label>
              <input id="sq" ref={input} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search shoes, leotards, brands or item numbers" autoComplete="off" />
              <button className="btn" type="submit">Search</button>
            </form>
            <div className="suggest">
              {hits.map((p) => (
                <Link key={p.slug} to={`/p/${p.slug}`}>
                  <img src={imgUrl(p.main)} alt="" width={44} height={55} loading="lazy" />
                  <span>
                    {p.name}
                    <br />
                    <small>{priceLabel(p)}</small>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </header>
    </>
  )
}

function Footer() {
  const c = config.contact
  return (
    <footer className="ftr">
      <div className="wrap">
        <div className="ftr-g">
          <div>
            <Link className="logo" to="/">
              <LogoMark />
              <span>{BRAND}</span>
            </Link>
            <p>{config.tagline}.</p>
          </div>
          <div>
            <h4>Shop</h4>
            <ul>
              {CAT_KEYS.map((k) => (
                <li key={k}><Link to={`/shop/${k}`}>{CATS[k].label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Help</h4>
            <ul>
              <li><Link to="/size-guide">Size guide</Link></li>
              <li><Link to="/shipping">Shipping</Link></li>
              <li><Link to="/returns">Returns &amp; exchanges</Link></li>
              <li><Link to="/about">About us</Link></li>
            </ul>
          </div>
          <div>
            <h4>Contact</h4>
            <ul>
              {c.email && <li><a href={`mailto:${c.email}`}>{c.email}</a></li>}
              {c.showPhone && c.phone && <li><a href={`tel:${c.phone}`}>{c.phone}</a></li>}
              <li><Link to="/contact">Contact us</Link></li>
              {c.address && <li>{c.address}</li>}
            </ul>
          </div>
        </div>
        <small>
          &copy; {new Date().getFullYear()} {BRAND}. <Link to="/privacy">Privacy policy</Link> &middot; <Link to="/terms">Terms of sale</Link> &middot;{' '}
          <button className="linkbtn" onClick={() => window.dispatchEvent(new Event('dw-consent-open'))}>Cookie preferences</button>
        </small>
      </div>
    </footer>
  )
}

function Consent() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    if (getConsent() === null) setShow(true)
    const open = () => setShow(true)
    window.addEventListener('dw-consent-open', open)
    return () => window.removeEventListener('dw-consent-open', open)
  }, [])
  const choose = (g: boolean) => {
    setConsent(g)
    setShow(false)
  }
  return (
    <div className={'consent' + (show ? ' show' : '')} role="dialog" aria-label="Cookie preferences">
      <p>
        We use cookies to measure traffic and ads. You can accept or decline - the site works either way. See our <Link to="/privacy">privacy policy</Link>.
      </p>
      <div className="row">
        <button className="btn" onClick={() => choose(true)}>Accept</button>
        <button className="btn ghost" onClick={() => choose(false)}>Decline</button>
      </div>
    </div>
  )
}

function Toast() {
  const { notice } = useCart()
  return (
    <div className={'toast' + (notice ? ' show' : '')} role="status">
      {notice}
      {notice && <Link to="/cart">View cart</Link>}
    </div>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  const wa = config.contact.whatsapp.replace(/\D/g, '')
  return (
    <>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <Consent />
      <Toast />
      {wa && <a className="wa" href={`https://wa.me/${wa}`} rel="noopener">WhatsApp us</a>}
    </>
  )
}
