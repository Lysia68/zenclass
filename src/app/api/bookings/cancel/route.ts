import { NextRequest, NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"
import { sendEmail } from "@/lib/email"
import { sendSMS, smsConfirmation } from "@/lib/sms"

export const dynamic = "force-dynamic"

// POST /api/bookings/cancel — annule un booking + promeut le 1er en waitlist
export async function POST(req: NextRequest) {
  try {
    const { bookingId, sessionId, memberId } = await req.json()
    if (!bookingId && !sessionId) {
      return NextResponse.json({ error: "bookingId ou sessionId requis" }, { status: 400 })
    }

    const db = createServiceSupabase()

    // Si on a un bookingId direct, l'annuler
    if (bookingId) {
      const { data: booking } = await db.from("bookings")
        .select("id, session_id, member_id, status")
        .eq("id", bookingId).single()

      if (!booking) return NextResponse.json({ error: "Booking introuvable" }, { status: 404 })
      if (booking.status === "cancelled") return NextResponse.json({ ok: true, already: true })

      // Annuler le booking
      await db.from("bookings").update({ status: "cancelled" }).eq("id", bookingId)

      // Restituer le crédit si applicable
      await restoreCredit(db, booking.member_id)

      // Promouvoir le 1er en waitlist
      const promoted = await promoteWaitlist(db, booking.session_id)

      return NextResponse.json({ ok: true, promoted: promoted?.memberName || null })
    }

    // Si on a sessionId + memberId (cas adhérent)
    if (sessionId && memberId) {
      const { data: booking } = await db.from("bookings")
        .select("id, status")
        .eq("session_id", sessionId).eq("member_id", memberId)
        .neq("status", "cancelled").maybeSingle()

      if (!booking) return NextResponse.json({ error: "Booking introuvable" }, { status: 404 })

      await db.from("bookings").update({ status: "cancelled" }).eq("id", booking.id)
      await restoreCredit(db, memberId)
      const promoted = await promoteWaitlist(db, sessionId)

      return NextResponse.json({ ok: true, promoted: promoted?.memberName || null })
    }

    return NextResponse.json({ error: "Paramètres insuffisants" }, { status: 400 })
  } catch (err: any) {
    console.error("POST /api/bookings/cancel error:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/** Restitue 1 crédit au membre si son abonnement est basé sur des crédits */
async function restoreCredit(db: any, memberId: string) {
  const { data: member } = await db.from("members")
    .select("credits, credits_total, subscription_id, subscriptions(period)")
    .eq("id", memberId).single()

  if (!member) return
  const period = (member as any).subscriptions?.period
  const isUnlimited = period === "mois" || period === "trimestre" || period === "année"
  const hasCredits = (member.credits_total ?? 0) > 0

  if (hasCredits && !isUnlimited) {
    const newCredits = Math.min((member.credits ?? 0) + 1, member.credits_total ?? 999)
    await db.from("members").update({ credits: newCredits }).eq("id", memberId)
    console.log(`[cancel] Crédit restitué — membre ${memberId} : ${member.credits} → ${newCredits}`)
  }
}

/** Promeut le 1er booking en waitlist pour cette session → confirmed + notifie */
async function promoteWaitlist(db: any, sessionId: string): Promise<{ memberName: string } | null> {
  // Vérifier qu'il y a de la place
  const [{ data: sess }, { count: confirmedCount }] = await Promise.all([
    db.from("sessions").select("spots, session_date, session_time, discipline_id, disciplines(name, icon), studio_id")
      .eq("id", sessionId).single(),
    db.from("bookings").select("id", { count: "exact", head: true })
      .eq("session_id", sessionId).eq("status", "confirmed"),
  ])

  if (!sess || (confirmedCount || 0) >= (sess.spots || 999)) return null

  // Trouver le 1er en waitlist (FIFO par date de création)
  const { data: waitlisted } = await db.from("bookings")
    .select("id, member_id, members(first_name, last_name, email, phone, sms_opt_in, credits, credits_total, subscription_id, subscriptions(period))")
    .eq("session_id", sessionId).eq("status", "waitlist")
    .order("created_at", { ascending: true })
    .limit(1)

  if (!waitlisted?.length) return null

  const booking = waitlisted[0]
  const member = booking.members as any

  // Promouvoir : waitlist → confirmed
  await db.from("bookings").update({ status: "confirmed" }).eq("id", booking.id)

  // Déduire un crédit si applicable
  const period = member?.subscriptions?.period
  const isUnlimited = period === "mois" || period === "trimestre" || period === "année"
  const hasCredits = (member?.credits_total ?? 0) > 0
  if (hasCredits && !isUnlimited) {
    await db.from("members").update({
      credits: Math.max(0, (member.credits ?? 1) - 1)
    }).eq("id", booking.member_id)
  }

  // Notifier le membre promu
  const memberName = `${member?.first_name || ""} ${member?.last_name || ""}`.trim()
  const { data: studio } = await db.from("studios")
    .select("name, slug, email, sms_enabled, sms_credits_balance")
    .eq("id", sess.studio_id).single()

  if (studio && member?.email && process.env.SENDGRID_API_KEY) {
    const disc = sess.disciplines as any
    const discName = disc?.name || "Séance"
    const sessDate = new Date(sess.session_date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
    const sessTime = sess.session_time?.slice(0, 5) || ""

    await sendEmail({
      to: member.email,
      subject: `Place disponible — ${discName} chez ${studio.name}`,
      html: buildPromotionEmail({ studioName: studio.name, discName, discIcon: disc?.icon || "", sessDate, sessTime, firstName: member.first_name || memberName }),
      fromName: studio.name,
    })
  }

  // SMS si activé
  if (studio?.sms_enabled && member?.phone && member.sms_opt_in !== false) {
    const balance = studio.sms_credits_balance ?? 0
    if (balance > 0) {
      const disc = sess.disciplines as any
      const discName = disc?.name || "Séance"
      const sessDate = new Date(sess.session_date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })
      const sessTime = sess.session_time?.slice(0, 5) || ""
      await (await import("@/lib/sms")).sendSMS({
        to: member.phone,
        body: `Place liberee : ${discName} ${sessDate} a ${sessTime} chez ${studio.name}. Votre reservation est confirmee !`,
      })
      await db.from("studios").update({ sms_credits_balance: balance - 1 }).eq("id", sess.studio_id)
    }
  }

  console.log(`[waitlist] Promu: ${memberName} pour session ${sessionId}`)
  return { memberName }
}

function buildPromotionEmail({ studioName, discName, discIcon, sessDate, sessTime, firstName }: any) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F0EBE3;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0EBE3;padding:32px 16px;"><tr><td align="center">
<table width="100%" style="max-width:540px;background:#fff;overflow:hidden;box-shadow:0 4px 24px rgba(42,31,20,.10);">
  <tr><td style="background:linear-gradient(135deg,#2A1F14 0%,#5C3D20 100%);padding:24px 32px 18px;">
    <div style="font-size:20px;font-weight:800;color:#F5D5A8;">${studioName}</div>
    <div style="font-size:10px;color:rgba(255,255,255,.45);margin-top:4px;text-transform:uppercase;letter-spacing:1.5px;">Place disponible</div>
  </td></tr>
  <tr><td style="background:#4E8A58;padding:8px 32px;">
    <span style="font-size:12px;font-weight:700;color:#fff;">Votre reservation est confirmee</span>
  </td></tr>
  <tr><td style="padding:28px 32px 20px;">
    <p style="font-size:16px;color:#2A1F14;font-weight:700;margin:0 0 10px;">Bonjour ${firstName},</p>
    <p style="font-size:14px;color:#5C4A38;line-height:1.7;margin:0 0 22px;">
      Une place s'est liberee ! Votre inscription en liste d'attente pour <strong>${discName}</strong> a ete automatiquement confirmee.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F2EA;border:1.5px solid #DDD5C8;border-radius:10px;margin-bottom:20px;">
      <tr><td style="padding:16px 20px;">
        <div style="font-size:14px;font-weight:700;color:#2A1F14;margin-bottom:8px;">${discIcon} ${discName}</div>
        <div style="font-size:13px;color:#5C4A38;">Date : <strong>${sessDate}</strong></div>
        <div style="font-size:13px;color:#5C4A38;">Heure : <strong>${sessTime}</strong></div>
      </td></tr>
    </table>
    <p style="font-size:13px;color:#8C7B6C;line-height:1.6;margin:0;">A tres bientot sur votre tapis !</p>
  </td></tr>
  <tr><td style="background:#FDFAF7;border-top:2px solid #F0E8DC;padding:12px 32px;text-align:center;">
    <p style="font-size:10px;color:#B0A090;margin:0;">${studioName} · Gere avec <a href="https://fydelys.fr" style="color:#A06838;text-decoration:none;">Fydelys</a></p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`
}
