import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase-server"
import { sendSMS } from "@/lib/sms"
import { sendEmail } from "@/lib/email"

export const dynamic = "force-dynamic"

// POST /api/sa/test-notifications
// Body: { email: "test@example.com", phone: "+33612345678" }
export async function POST(req: NextRequest) {
  try {
    // Vérifier superadmin
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    const db = createServiceSupabase()
    const { data: profile } = await db.from("profiles").select("role").eq("id", user.id).single()
    if (profile?.role !== "superadmin")
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

    const { email, phone } = await req.json()
    const results: Record<string, any> = {}

    // ── Test Email ──────────────────────────────────────────
    if (email) {
      const result = await sendEmail({
        to: email,
        subject: "Test email Fydelys — configuration OK",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:40px auto;padding:32px;background:#F8F2EA;border-radius:12px;">
            <h2 style="color:#2A1F14;">Email de test Fydelys</h2>
            <p style="color:#5C4A38;">Si vous recevez cet email, SendGrid est correctement configuré.</p>
            <hr style="border:none;border-top:1px solid #DDD5C8;margin:20px 0;">
            <p style="font-size:12px;color:#B0A090;">Envoyé depuis <a href="https://fydelys.fr" style="color:#A06838;">Fydelys</a> — Super Admin</p>
          </div>
        `,
      })
      results.email = result.ok
        ? { ok: true, message: `Email envoyé à ${email}` }
        : { ok: false, message: `Erreur SendGrid: ${result.error}` }
    } else {
      results.email = { ok: false, message: "Email non fourni" }
    }

    // ── Test SMS ────────────────────────────────────────────
    if (phone) {
      const smsResult = await sendSMS({
        to: phone,
        body: "✅ Test SMS Fydelys — configuration OK ! Ce message confirme que Twilio est bien configuré.",
      })
      results.sms = smsResult
    } else {
      results.sms = { ok: false, message: "Téléphone non fourni" }
    }

    return NextResponse.json({ ok: true, results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
