import { Link } from 'react-router-dom'
import { BRAND } from '../config'
import { Seo, canonicalFor } from '../lib/seo'

export default function NotFound() {
  return (
    <>
      <Seo title={`Page not found | ${BRAND}`} description="This page could not be found." canonical={canonicalFor('/')} noindex />
      <div className="wrap">
        <div className="page-h">
          <h1>We could not find that page</h1>
          <p>It may have moved, or the item is no longer available.</p>
          <p>
            <Link className="btn" to="/shop">Browse all dancewear</Link>
          </p>
        </div>
      </div>
    </>
  )
}
