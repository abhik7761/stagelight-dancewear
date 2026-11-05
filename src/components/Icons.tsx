import type { ReactNode } from 'react'

const wrap = (d: ReactNode) => (
  <svg className="ico" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
)

export const IcoReturn = () => wrap(<><path d="M6 13h14a6 6 0 0 1 0 12h-6" /><path d="m11 8-5 5 5 5" /></>)
export const IcoRuler = () => wrap(<><rect x="3" y="11" width="26" height="10" rx="2" /><path d="M8 11v4M13 11v6M18 11v4M23 11v6" /></>)
export const IcoBox = () => wrap(<><path d="M4 10 16 4l12 6v12l-12 6-12-6V10Z" /><path d="m4 10 12 6 12-6M16 16v12" /></>)
export const IcoCheck = () => wrap(<><circle cx="16" cy="16" r="12" /><path d="m10.5 16.5 3.8 3.8 7.2-8" /></>)
export const IcoChat = () => wrap(<><path d="M5 7h22v15H14l-6 5v-5H5V7Z" /><path d="M11 13h10M11 17h6" /></>)
export const IcoArrow = () => (
  <svg className="arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)
