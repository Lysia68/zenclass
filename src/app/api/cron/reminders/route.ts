import { NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"
import { sendSMS, smsReminder } from "@/lib/sms"

export const dynamic = "force-dynamic"

// Appelé par Vercel Cron toutes les heures : 0 * * * *
// Envoie les rappels X heures avant chaque séance (selon reminder_hours_default du studio)
export async function GET(request: Request) {
  // Sécurité : vérifier le header Vercel Cron
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const db = createServiceSupabase()
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY

  // Charger tous les studios actifs avec leur config rappel
  const { data: studios } = await db
    .from("studios")
    .select("id, name, slug, email, timezone, reminder_hours_default, sms_enabled")
    .eq("status", "actif")

  if (!studios?.length) return NextResponse.json({ ok: true, processed: 0, debug: "no studios with status=actif" })

  let totalSent = 0
  let totalSkipped = 0
  const errors: string[] = []
  const debugInfo: any[] = []

  for (const studio of studios) {
    const reminderHours = studio.reminder_hours_default ?? 24
    const tz = studio.timezone || "Europe/Paris"

    // Calculer la fenêtre : séances qui démarrent dans [reminderHours-0.5h, reminderHours+0.5h]
    const now = new Date()
    const windowStart = new Date(now.getTime() + (reminderHours - 0.5) * 3600 * 1000)
    const windowEnd   = new Date(now.getTime() + (reminderHours + 0.5) * 3600 * 1000)
    debugInfo.push({ studio: studio.name, reminderHours, now: now.toISOString(), windowStart: windowStart.toISOString(), windowEnd: windowEnd.toISOString() })

    // Dates en format YYYY-MM-DD pour la query
    const dateStart = windowStart.toISOString().slice(0, 10)
    const dateEnd   = windowEnd.toISOString().slice(0, 10)

    // Charger les séances dans la fenêtre
    const { data: sessions } = await db
      .from("sessions")
      .select("id, session_date, session_time, duration_min, teacher, room, discipline_id, disciplines(name, icon)")
      .eq("studio_id", studio.id)
      .eq("status", "scheduled")
      .gte("session_date", dateStart)
      .lte("session_date", dateEnd)

    debugInfo[debugInfo.length-1].sessionsFound = sessions?.length || 0
    debugInfo[debugInfo.length-1].sessions = sessions?.map(s => ({ id: s.id, date: s.session_date, time: s.session_time }))
    if (!sessions?.length) continue

    // Filtrer précisément selon l'heure en tenant compte de la timezone du studio
    const targetSessions = sessions.filter(s => {
      // La session_date/time est stockée en heure locale du studio
      // Pour convertir en UTC : soustraire l'offset (Paris UTC+1 = +60min → UTC = local - 60min)
      const sessLocal = new Date(`${s.session_date}T${s.session_time}`)
      const tzOffsetMs = getTzOffsetMs(tz)
      const sessUTC = new Date(sessLocal.getTime() - tzOffsetMs)
      return sessUTC >= windowStart && sessUTC <= windowEnd
    })

    debugInfo[debugInfo.length-1].targetSessions = targetSessions.length
    debugInfo[debugInfo.length-1].sessionsDetail = sessions?.map(s => {
      const sessDateTime = new Date(`${s.session_date}T${s.session_time}`)
      const tzOffsetMs = getTzOffsetMs(tz)
      const sessUTC = new Date(sessDateTime.getTime() - tzOffsetMs)
      return { id: s.id, date: s.session_date, time: s.session_time, sessUTC: sessUTC.toISOString(), inWindow: sessUTC >= windowStart && sessUTC <= windowEnd }
    })
    if (!targetSessions.length) continue

    for (const sess of targetSessions) {
      // Vérifier qu'on n'a pas déjà envoyé le rappel pour cette séance
      const { data: existing } = await db
        .from("reminder_logs")
        .select("id")
        .eq("session_id", sess.id)
        .eq("type", "reminder")
        .maybeSingle()

      if (existing) { totalSkipped++; continue }

      // Charger les inscrits confirmés avec email
      const { data: bookings } = await db
        .from("bookings")
        .select("member_id, members(first_name, last_name, email, phone, sms_opt_in)")
        .eq("session_id", sess.id)
        .eq("status", "confirmed")

      const recipients = (bookings || [])
        .map((b: any) => ({
          name:      `${b.members?.first_name||""} ${b.members?.last_name||""}`.trim(),
          email:     b.members?.email || "",
          phone:     b.members?.phone || "",
          sms_opt_in: b.members?.sms_opt_in !== false,
        }))
        .filter((m: any) => m.email || m.phone)

      debugInfo[debugInfo.length-1].bookingsForSess = (bookings || []).length
      debugInfo[debugInfo.length-1].recipients = recipients.length
      if (!recipients.length) { totalSkipped++; continue }

      // Formater la séance
      const sessDate = new Date(sess.session_date).toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" })
      const sessTime = sess.session_time?.slice(0, 5) || ""
      const disc = (sess as any).disciplines
      const discName = disc?.name || "Séance"
      const discIcon = disc?.icon || "🧘"

      if (SENDGRID_API_KEY) {
        // Envoyer les emails
        await Promise.allSettled(recipients.map(async (member: any) => {
          const firstName = member.name.split(" ")[0] || member.name
          const subjectLabel = reminderHours <= 3 ? "dans quelques heures" : reminderHours <= 12 ? `dans ${reminderHours}h` : reminderHours <= 26 ? "demain" : `dans ${Math.round(reminderHours/24)} jours`
          const body = {
            personalizations: [{ to: [{ email: member.email }], subject: `⏰ Rappel — ${discName} ${subjectLabel} chez ${studio.name}` }],
            from: { email: "noreply@synq9.com", name: studio.name },
            content: [{ type: "text/html", value: buildReminderEmail({ studio, sess, sessDate, sessTime, discName, discIcon, member, firstName, reminderHours }) }]
          }
          const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: { "Authorization": `Bearer ${SENDGRID_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify(body)
          })
          if (!res.ok) { const e = await res.text(); throw new Error(e) }
        }))
        totalSent += recipients.length
      } else {
        console.log(`[CRON reminders] Simulé — ${studio.name} | ${discName} ${sessDate} ${sessTime} → ${recipients.length} destinataires`)
        totalSent += recipients.length
      }

      // SMS rappels si activé + crédits disponibles
      if (studio.sms_enabled) {
        const smsRecipients = recipients.filter((m: any) => m.phone && m.sms_opt_in)
        if (smsRecipients.length > 0) {
          const { data: studioCredits } = await db.from("studios")
            .select("sms_credits_balance").eq("id", studio.id).single()
          let balance = studioCredits?.sms_credits_balance ?? 0
          const smsBody = smsReminder({ studioName: studio.name, discName, sessTime, reminderHours })
          let smsSent = 0
          for (const m of smsRecipients) {
            if (balance <= 0) break
            const result = await sendSMS({ to: m.phone, body: smsBody })
            if (result.ok) { smsSent++; balance-- }
          }
          if (smsSent > 0) {
            await db.from("studios").update({ sms_credits_balance: balance }).eq("id", studio.id)
          }
        }
      }

      // Logger pour ne pas re-envoyer
      await db.from("reminder_logs").insert({ session_id: sess.id, studio_id: studio.id, type: "reminder", sent_count: recipients.length })
    }
  }

  return NextResponse.json({ ok: true, sent: totalSent, skipped: totalSkipped, errors, debug: debugInfo })
}

// Offset timezone en millisecondes (positif = ahead of UTC, ex: Paris UTC+1 = +3600000ms)
function getTzOffsetMs(tz: string): number {
  try {
    const now = new Date()
    // toLocaleString donne l'heure locale — la différence avec UTC donne l'offset
    const localStr = now.toLocaleString("en-US", { timeZone: tz })
    const localDate = new Date(localStr)
    return Math.round(localDate.getTime() - now.getTime())
  } catch {
    return 3600000 // fallback Europe/Paris hiver UTC+1
  }
}

// Alias pour compatibilité
function getTzOffsetMinutes(tz: string): number {
  return getTzOffsetMs(tz) / 60000
}

function buildReminderEmail({ studio, sess, sessDate, sessTime, discName, discIcon, member, firstName, reminderHours }: any) {
  const urgencyLabel = reminderHours <= 3
    ? "⚡ C'est bientôt l'heure !"
    : reminderHours <= 12
      ? `Dans ${reminderHours}h, votre séance vous attend`
      : reminderHours <= 26
        ? "Votre séance est demain"
        : `Votre séance est dans ${Math.round(reminderHours/24)} jours`

  const urgencyColor = reminderHours <= 3 ? "#C4400C" : reminderHours <= 26 ? "#A06838" : "#4E8A58"
  const urgencyBg    = reminderHours <= 3 ? "#FEF3E2" : reminderHours <= 26 ? "#F5EBE0" : "#E6F2E8"

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Rappel — ${discName}</title>
</head>
<body style="margin:0;padding:0;background:#F0EBE3;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0EBE3;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:540px;">

        <!-- Header studio -->
        <tr>
          <td style="background:linear-gradient(135deg,#2A1F14 0%,#5C3D20 100%);padding:32px 36px 24px;text-align:center;border-radius:16px 16px 0 0;">
            <div style="width:56px;height:56px;background:rgba(255,255,255,.12);border-radius:14px;margin:0 auto 14px;display:flex;align-items:center;justify-content:center;font-size:28px;line-height:56px;text-align:center;">${discIcon}</div>
            <div style="font-size:22px;font-weight:800;color:#F5D5A8;letter-spacing:-0.5px;">${studio.name}</div>
            <div style="margin-top:8px;display:inline-block;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);border-radius:20px;padding:4px 14px;">
              <span style="font-size:11px;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">⏰ Rappel de séance</span>
            </div>
          </td>
        </tr>

        <!-- Bandeau urgence -->
        <tr>
          <td style="background:${urgencyColor};padding:11px 36px;text-align:center;">
            <span style="font-size:13px;font-weight:700;color:#fff;letter-spacing:0.3px;">${urgencyLabel}</span>
          </td>
        </tr>

        <!-- Corps principal -->
        <tr>
          <td style="background:#FFFFFF;padding:32px 36px 24px;">

            <!-- Salutation -->
            <p style="font-size:17px;color:#2A1F14;font-weight:700;margin:0 0 8px;">
              Bonjour ${firstName} 👋
            </p>
            <p style="font-size:14px;color:#5C4A38;line-height:1.7;margin:0 0 28px;">
              Votre prochaine séance chez <strong>${studio.name}</strong> approche. Voici tous les détails :
            </p>

            <!-- Carte séance -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#FDFAF7;border:1.5px solid #DDD5C8;border-radius:12px;margin-bottom:28px;overflow:hidden;">
              <tr>
                <td style="background:#F5EBE0;padding:14px 20px;border-bottom:1px solid #EDE4D8;">
                  <span style="font-size:18px;vertical-align:middle;">${discIcon}</span>
                  <span style="font-size:16px;font-weight:800;color:#2A1F14;vertical-align:middle;margin-left:8px;">${discName}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:7px 0;border-bottom:1px solid #F0E8DC;">
                        <span style="font-size:13px;color:#A06838;font-weight:700;">📅</span>
                        <span style="font-size:13px;color:#8C7B6C;margin-left:6px;width:60px;display:inline-block;">Date</span>
                        <span style="font-size:14px;color:#2A1F14;font-weight:700;">${sessDate}</span>
                      </td>
                    </tr>
                    ${sessTime ? `
                    <tr>
                      <td style="padding:7px 0;border-bottom:1px solid #F0E8DC;">
                        <span style="font-size:13px;color:#A06838;font-weight:700;">🕐</span>
                        <span style="font-size:13px;color:#8C7B6C;margin-left:6px;width:60px;display:inline-block;">Heure</span>
                        <span style="font-size:14px;color:#2A1F14;font-weight:700;">${sessTime}${sess.duration_min ? ` <span style="color:#8C7B6C;font-weight:400;font-size:12px;">· ${sess.duration_min} min</span>` : ""}</span>
                      </td>
                    </tr>` : ""}
                    ${sess.teacher ? `
                    <tr>
                      <td style="padding:7px 0;border-bottom:1px solid #F0E8DC;">
                        <span style="font-size:13px;color:#A06838;font-weight:700;">👤</span>
                        <span style="font-size:13px;color:#8C7B6C;margin-left:6px;width:60px;display:inline-block;">Coach</span>
                        <span style="font-size:14px;color:#2A1F14;font-weight:700;">${sess.teacher}</span>
                      </td>
                    </tr>` : ""}
                    ${sess.room ? `
                    <tr>
                      <td style="padding:7px 0;">
                        <span style="font-size:13px;color:#A06838;font-weight:700;">📍</span>
                        <span style="font-size:13px;color:#8C7B6C;margin-left:6px;width:60px;display:inline-block;">Salle</span>
                        <span style="font-size:14px;color:#2A1F14;font-weight:700;">${sess.room}</span>
                      </td>
                    </tr>` : ""}
                  </table>
                </td>
              </tr>
            </table>

            <!-- Message de clôture -->
            <p style="font-size:14px;color:#5C4A38;line-height:1.7;margin:0;text-align:center;">
              🌟 À très bientôt sur votre tapis !
            </p>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F5EBE0;padding:16px 36px;border-radius:0 0 16px 16px;border-top:1px solid #DDD5C8;text-align:center;">
            <p style="font-size:11px;color:#A08060;margin:0;line-height:1.8;">
              ${studio.name} · Géré avec
              <a href="https://fydelys.fr" style="color:#A06838;text-decoration:none;font-weight:600;">Fydelys</a>
            </p>
            <p style="font-size:10px;color:#C0A880;margin:4px 0 0;">
              Vous recevez ce message car vous êtes inscrit(e) à cette séance.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}