import { Link } from 'react-router-dom'
import { config } from '../config'
import type { ProductLite } from '../types'
import { imgUrl, priceLabel, swatchUrl } from '../lib/format'

export function Card({ p, eager = false }: { p: ProductLite; eager?: boolean }) {
  const to = `/p/${p.slug}`
  const extra = p.colors.length - 5
  return (
    <article className="card">
      <Link className="ph" to={to} tabIndex={-1} aria-hidden="true">
        <img src={imgUrl(p.main)} alt="" width={640} height={800} loading={eager ? 'eager' : 'lazy'} decoding="async" />
      </Link>
      <div className="brand">{config.showBrandNames && !p.name.toLowerCase().startsWith(p.brand.toLowerCase().split(' ')[0]) ? p.brand : ' '}</div>
      <h3>
        <Link to={to}>{p.name}</Link>
      </h3>
      <div className="price">{priceLabel(p)}</div>
      <div className="gtag">{p.groups.map((g) => (g === 'Child' ? 'Kids' : g)).join(' · ')} sizes</div>
      <div className="sw">
        {p.colors.slice(0, 5).map((c) => (
          <i key={c} title={c} style={{ backgroundImage: `url(${swatchUrl(c)})` }} />
        ))}
        {extra > 0 && <span>+{extra}</span>}
      </div>
      <Link className="btn buy-card" to={to}>Buy now</Link>
    </article>
  )
}

export function Crumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <nav className="crumbs wrap" aria-label="Breadcrumb">
      <Link to="/">Home</Link>
      {items.map((it, i) => (
        <span key={it.path} style={{ margin: 0 }}>
          <span>/</span>
          {i === items.length - 1 ? <span aria-current="page" style={{ margin: 0 }}>{it.name}</span> : <Link to={it.path}>{it.name}</Link>}
        </span>
      ))}
    </nav>
  )
}
