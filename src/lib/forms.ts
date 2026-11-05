import { BRAND, config } from '../config'

export interface SendResult {
  ok: boolean
  /** true when no form service is configured and we fell back to the visitor's email app */
  fallback?: boolean
  /** demo mode: nothing was sent anywhere */
  demo?: boolean
  error?: string
}

/** Sends a form through Web3Forms when a key is set; otherwise opens a prefilled email (or reports a clear error). */
export async function sendForm(subject: string, fields: Record<string, string>): Promise<SendResult> {
  const key = config.forms.web3formsKey
  if (key) {
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ access_key: key, subject: `${BRAND}: ${subject}`, from_name: BRAND, ...fields }),
      })
      const data = (await res.json()) as { success?: boolean; message?: string }
      return data.success ? { ok: true } : { ok: false, error: data.message || 'The message could not be sent.' }
    } catch {
      return { ok: false, error: 'Network problem - please try again.' }
    }
  }
  // No form service key. While demoMode is on, the flow completes without sending anything.
  if (config.forms.demoMode) return { ok: true, demo: true }
  // Otherwise fall back to the visitor's email app, addressed to the private lead inbox.
  const to = config.forms.leadEmail || config.contact.email
  if (to) {
    const body = Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n')
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(`${BRAND}: ${subject}`)}&body=${encodeURIComponent(body)}`
    return { ok: true, fallback: true }
  }
  return { ok: false, error: 'Forms are not connected yet. Please add a Web3Forms key or contact email in site.config.json.' }
}
