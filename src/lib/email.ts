/**
 * Helper centralisé pour l'envoi d'emails via SendGrid.
 * - Adresse from unifiée : noreply@fydelys.fr
 * - Toujours text/plain + text/html (anti-spam)
 */

const SENDGRID_URL = "https://api.sendgrid.com/v3/mail/send"
const FROM_EMAIL = "noreply@fydelys.fr"

type SendEmailOptions = {
  to: string | { email: string; name?: string }
  subject: string
  html: string
  fromName?: string
  replyTo?: { email: string; name?: string }
}

/** Extrait le texte brut d'un HTML email (fallback simple) */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/td>/gi, " ")
    .replace(/<hr[^>]*>/gi, "---\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#?\w+;/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export async function sendEmail({ to, subject, html, fromName, replyTo }: SendEmailOptions): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.SENDGRID_API_KEY
  if (!apiKey) return { ok: false, error: "SENDGRID_API_KEY manquante" }

  const toObj = typeof to === "string" ? { email: to } : to
  const plainText = htmlToPlainText(html)

  const body: any = {
    personalizations: [{ to: [toObj], subject }],
    from: { email: FROM_EMAIL, name: fromName || "Fydelys" },
    content: [
      { type: "text/plain", value: plainText },
      { type: "text/html", value: html },
    ],
  }

  if (replyTo) body.reply_to = replyTo

  const res = await fetch(SENDGRID_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error("SendGrid error:", err)
    return { ok: false, error: err }
  }

  return { ok: true }
}
