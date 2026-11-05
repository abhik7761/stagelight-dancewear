/* Ads + analytics wiring: Google Analytics 4, Google Ads, Microsoft Advertising (UET), Microsoft Clarity.
   Everything is consent-gated (Consent Mode v2). IDs come from site.config.json -> "tracking". Empty ID = that tool is off. */
import { config } from '../config'

type Win = Window & { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void; uetq?: unknown[] & { push: (...a: unknown[]) => void }; clarity?: (...a: unknown[]) => void }
const w = (): Win | null => (typeof window === 'undefined' ? null : (window as Win))
const KEY = 'dw_consent'
const t = config.tracking
const anyAds = Boolean(t.ga4 || t.googleAds)

export const getConsent = (): 'granted' | 'denied' | null => {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'granted' || v === 'denied' ? v : null
  } catch {
    return null
  }
}

function load(src: string) {
  const s = document.createElement('script')
  s.async = true
  s.src = src
  document.head.appendChild(s)
}

let started = false
function start(granted: boolean) {
  const win = w()
  if (!win) return
  const state = granted ? 'granted' : 'denied'
  if (anyAds) {
    win.dataLayer = win.dataLayer || []
    win.gtag = function () {
      // eslint-disable-next-line prefer-rest-params
      win.dataLayer!.push(arguments)
    }
    if (!started) {
      win.gtag('consent', 'default', { ad_storage: state, analytics_storage: state, ad_user_data: state, ad_personalization: state, wait_for_update: 500 })
      win.gtag('js', new Date())
      if (t.ga4) win.gtag('config', t.ga4)
      if (t.googleAds) win.gtag('config', t.googleAds)
      load(`https://www.googletagmanager.com/gtag/js?id=${t.ga4 || t.googleAds}`)
    } else {
      win.gtag('consent', 'update', { ad_storage: state, analytics_storage: state, ad_user_data: state, ad_personalization: state })
    }
  }
  if (t.microsoftUet) {
    if (!started) {
      const q: unknown[] = []
      win.uetq = q as Win['uetq']
      const s = document.createElement('script')
      s.async = true
      s.src = '//bat.bing.com/bat.js'
      s.onload = () => {
        const U = (win as unknown as { UET: new (o: object) => unknown }).UET
        win.uetq = new U({ ti: t.microsoftUet, q, enableAutoSpaTracking: true }) as Win['uetq']
      }
      document.head.appendChild(s)
      win.uetq!.push('consent', 'default', { ad_storage: state })
    } else {
      win.uetq!.push('consent', 'update', { ad_storage: state })
    }
  }
  if (granted && t.clarity && !started) {
    const c = ((win as unknown as { clarity: unknown }).clarity = function (...a: unknown[]) {
      ;((c as unknown as { q: unknown[] }).q = (c as unknown as { q?: unknown[] }).q || []).push(a)
    })
    load(`https://www.clarity.ms/tag/${t.clarity}`)
  }
  started = true
}

export function initTracking() {
  const c = getConsent()
  start(c === 'granted')
}

export function setConsent(granted: boolean) {
  try {
    localStorage.setItem(KEY, granted ? 'granted' : 'denied')
  } catch {
    /* storage blocked - choice just won't persist */
  }
  start(granted)
}

interface Item { id: string; name: string; brand: string; variant: string; price: number; qty: number }
const gaItems = (items: Item[]) => items.map((i) => ({ item_id: i.id, item_name: i.name, item_brand: i.brand, item_variant: i.variant, price: i.price, quantity: i.qty }))

function ga(event: string, params: object) {
  const win = w()
  if (win?.gtag) win.gtag('event', event, params)
}
function uet(action: string, params: object = {}) {
  const win = w()
  win?.uetq?.push('event', action, params)
}

export const trackViewItem = (i: Item) => {
  ga('view_item', { currency: config.currency, value: i.price, items: gaItems([i]) })
  uet('view_item', { ecomm_prodid: i.id, ecomm_pagetype: 'product', revenue_value: i.price, currency: config.currency })
}
export const trackAddToCart = (i: Item) => {
  const value = i.price * i.qty
  ga('add_to_cart', { currency: config.currency, value, items: gaItems([i]) })
  if (t.googleAds && t.googleAdsAddToCartLabel) ga('conversion', { send_to: `${t.googleAds}/${t.googleAdsAddToCartLabel}`, value, currency: config.currency })
  uet('add_to_cart', { ecomm_prodid: i.id, ecomm_pagetype: 'cart', revenue_value: value, currency: config.currency })
}
export const trackBeginCheckout = (items: Item[], value: number) => {
  ga('begin_checkout', { currency: config.currency, value, items: gaItems(items) })
  uet('begin_checkout', { revenue_value: value, currency: config.currency })
}
/** Order request sent = lead conversion (no payment happens on the site). */
export const trackLead = (value: number) => {
  ga('generate_lead', { currency: config.currency, value })
  if (t.googleAds && t.googleAdsLeadLabel) ga('conversion', { send_to: `${t.googleAds}/${t.googleAdsLeadLabel}`, value, currency: config.currency })
  uet('lead', { revenue_value: value, currency: config.currency })
}
