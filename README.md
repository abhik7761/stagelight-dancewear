# Stagelight Dancewear

A statically prerendered e-commerce storefront for dance shoes and dancewear, built with **React**, **TypeScript** and **Vite**. Every page is rendered to real HTML at build time, so search engines and ad/merchant crawlers see complete content without executing JavaScript.

![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4-646cff?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

> **Note on content.** This repository contains the application code only. The product catalog and product photography are not included (see [Catalog data](#catalog-data)). The project does not build until you supply a catalog.

## Features

**Storefront**
- Shoe-first landing page: style finder (ballet, jazz, tap, hip-hop, lyrical, acro), best sellers with style tabs, shop by brand, kids and adult panels, a size-code explainer, price-capped collections, FAQ and call to action
- Category and sub-category pages for shoes, leotards, tops, bottoms, tights and accessories
- Product pages with colour and size variant selection, buying-guide copy and related products
- URL-driven filters, e.g. `/shop/shoes?g=Child`, `?brand=Bloch`, `?under=30`, `?q=pointe`
- Cart and an order-request checkout flow (no payment gateway; see [Checkout model](#checkout-model))

**SEO and advertising readiness**
- Static prerendering of every route, with a unique title, description, canonical URL and Open Graph tags per page
- JSON-LD structured data: `Product`, `BreadcrumbList`, `CollectionPage`, `Store`, `WebSite` and `FAQPage`
- Generated `sitemap.xml` and `robots.txt`
- Product feed for Google Merchant Center and Microsoft Merchant Center, one row per colour and size
- Consent Mode v2 banner; analytics and ad tags load only after the visitor accepts
- Tracking events: `view_item`, `add_to_cart`, `begin_checkout`, `generate_lead`
- Supported integrations: GA4, Google Ads, Microsoft UET, Microsoft Clarity (all disabled until IDs are configured)

## Tech stack

| Area | Technology |
| --- | --- |
| UI | React 18, React Router 6 |
| Language | TypeScript 5 |
| Build | Vite 5 (client build plus SSR build) |
| Prerendering | Custom Node script (`scripts/prerender.mjs`) |
| Data pipeline | Python 3 (`_tools/prepare_data.py`) |
| Forms | [Web3Forms](https://web3forms.com) |

## Getting started

**Prerequisites:** Node.js 18 or newer, and Python 3 if you want to run the data pipeline.

```bash
git clone https://github.com/abhik7761/stagelight-dancewear.git
cd stagelight-dancewear
npm install
```

Add a catalog first (see [Catalog data](#catalog-data)), then:

```bash
npm run dev        # development server at http://localhost:5173
npm run typecheck  # TypeScript check without emitting files
npm run build      # typecheck, client build, SSR build, then prerender all pages into dist/
npm run preview    # serve the production build at http://localhost:4173
```

## Catalog data

The storefront reads product data from three generated outputs, all produced by `_tools/prepare_data.py` from a source file at `data/source-products.json`:

| Output | Purpose |
| --- | --- |
| `src/data/products.json` | Lightweight index used for listing pages |
| `public/data/p/<slug>.json` | Full detail per product, used for product pages |
| `public/data/merchant-feed.tsv` | Merchant Center product feed |

Product photos are expected at `public/img/p/` as `.webp` files. The script keeps only products that have an image and at least one in-stock variant, and removes unused images.

```bash
python _tools/prepare_data.py
```

These files are listed in `.gitignore` on purpose. Use only catalog content and photography you have the right to publish, and respect the terms of any brand or supplier you source from.

## Configuration

All business settings live in [`site.config.json`](site.config.json). Edit it and run `npm run build` again.

| Section | What it controls |
| --- | --- |
| `brand`, `tagline`, `domain` | Store identity; `domain` is used for canonical URLs, the sitemap and the product feed |
| `currency`, `currencySymbol` | Display and feed currency |
| `contact` | Email, phone, WhatsApp, address and hours; `showPhone` hides the phone number site-wide |
| `forms` | `web3formsKey`, `leadEmail`, and `demoMode` |
| `tracking` | GA4, Google Ads (plus lead and add-to-cart labels), Microsoft UET, Clarity |
| `policies` | Shipping region, processing time, free-shipping threshold, return window |
| `pricing` | Optional markup tiers, price endings and per-SKU overrides |
| `showBrandNames` | Set to `false` to hide brand names across the site |

## Checkout model

Checkout is an **order-request flow**, not a payment flow. Customers submit their cart and details; the store owner receives the request by email through Web3Forms and replies with a payment link. To take payments directly, integrate a provider such as Stripe, Razorpay or Shopify.

How a submission is handled depends on `forms` in `site.config.json`:

| `web3formsKey` | `demoMode` | Behaviour |
| --- | --- | --- |
| set | any | Sent through Web3Forms |
| empty | `true` (default) | The flow completes but nothing is sent anywhere |
| empty | `false` | Opens the visitor's email app, pre-filled and addressed to `forms.leadEmail` (or `contact.email` if that is empty) |
| empty | `false`, no email configured | Shows an error that forms are not connected |

## Project structure

```
.
├── index.html               # HTML template with prerender placeholders
├── site.config.json         # Business settings, tracking IDs, policies, pricing
├── scripts/
│   └── prerender.mjs        # Renders every route to static HTML, writes sitemap and robots
├── _tools/
│   └── prepare_data.py      # Normalises the source catalog into site data and the feed
├── public/
│   └── favicon.svg
└── src/
    ├── App.tsx              # Routes
    ├── entry-server.tsx     # SSR entry used by the prerender step
    ├── main.tsx             # Client entry (hydration)
    ├── config.ts            # Typed access to site.config.json
    ├── types.ts
    ├── components/          # Layout, product card, icons, logo
    ├── pages/               # Home, Shop, Product, Cart, ThankYou, Info, NotFound
    ├── lib/                 # cart, data access, formatting, forms, orders, SEO, tracking
    └── styles/style.css
```

## Deployment

`dist/` is a fully static site. Deploy it to any static host: Netlify, Vercel, Cloudflare Pages, GitHub Pages or cPanel. `dist/404.html` is the not-found page.

## Before going live

1. Set the real `domain`, business name and contact details in `site.config.json`.
2. Add a Web3Forms access key (`forms.web3formsKey`) and set `forms.demoMode` to `false`, so order requests and the contact form are delivered.
3. Review the shipping, returns, privacy and terms pages so they match how the business actually operates.
4. Confirm you have the right to sell and display every brand name and photo in your catalog.
5. Set your own prices, using the `pricing` section if you want automated markup.
6. Add tracking IDs, then verify the events in each platform's debug tools.

## License

The source code is released under the [MIT License](LICENSE). The license does not cover any catalog data, product photography or brand names you add; those remain the property of their respective owners.
