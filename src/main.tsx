import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { CartProvider } from './lib/cart'
import { DataCtx } from './lib/pagedata'
import { initTracking } from './lib/track'
import type { PageData } from './types'
import './styles/style.css'

declare global {
  interface Window {
    __DATA__?: PageData
  }
}

const root = document.getElementById('root')!
const tree = (
  <StrictMode>
    <DataCtx.Provider value={window.__DATA__ ?? {}}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <CartProvider>
          <App />
        </CartProvider>
      </BrowserRouter>
    </DataCtx.Provider>
  </StrictMode>
)

// Hydrate only when the prerendered HTML belongs to this URL (static hosts without clean-URL rewrites may serve another page).
const here = window.location.pathname.replace(/\/+$/, '') || '/'
if (root.firstElementChild && root.dataset.path === here) hydrateRoot(root, tree)
else {
  root.innerHTML = ''
  createRoot(root).render(tree)
}

initTracking()
