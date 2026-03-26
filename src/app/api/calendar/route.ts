import { NextRequest, NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

// GET /api/calendar?memberId=xxx  ou  ?coachName=xxx&studioId=xxx
// Retourne un fichier .ics avec les séances réservées (membre) ou assignées (coach)
export async function GET(req: NextRequest) {
  const memberId = req.nextUrl.searchParams.get("memberId")
  const coachName = req.nextUrl.searchParams.get("coachName")
  const studioId = req.nextUrl.searchParams.get("studioId")

  if (!memberId && !(coachName && studioId)) {
    return NextResponse.json({ error: "memberId ou (coachName + studioId) requis" }, { status: 400 })
  }

  const db = createServiceSupabase()
  const today = new Date().toISOString().slice(0, 10)
  let sessions: any[] = []
  let calName = "Fydelys"

  if (memberId) {
    // Séances réservées par le membre (confirmées, à venir)
    const { data: bookings } = await db.from("bookings")
      .select("session_id, sessions(id, session_date, session_time, duration_min, teacher, room, status, discipline_id, disciplines(name), studio_id, studios(name))")
      .eq("member_id", memberId)
      .eq("status", "confirmed")

    sessions = (bookings || [])
      .map((b: any) => b.sessions)
      .filter((s: any) => s && s.session_date >= today && s.status === "scheduled")

    const { data: member } = await db.from("members")
      .select("first_name, last_name").eq("id", memberId).single()
    calName = member ? `${member.first_name} ${member.last_name} — Fydelys` : "Fydelys"

  } else if (coachName && studioId) {
    // Séances assignées au coach
    const { data } = await db.from("sessions")
      .select("id, session_date, session_time, duration_min, teacher, room, status, discipline_id, disciplines(name), studio_id, studios(name)")
      .eq("studio_id", studioId)
      .ilike("teacher", `%${coachName}%`)
      .gte("session_date", today)
      .eq("status", "scheduled")
      .order("session_date")

    sessions = data || []
    calName = `${coachName} — Fydelys`
  }

  const ics = buildICS(sessions, calName)

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="fydelys.ics"`,
    },
  })
}

function buildICS(sessions: any[], calName: string): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Fydelys//Séances//FR",
    `X-WR-CALNAME:${calName}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ]

  for (const s of sessions) {
    const date = s.session_date?.replace(/-/g, "")
    const time = s.session_time?.replace(/:/g, "").slice(0, 4) + "00"
    const duration = s.duration_min || 60
    const endMin = parseInt(s.session_time?.slice(0, 2) || "0") * 60 + parseInt(s.session_time?.slice(3, 5) || "0") + duration
    const endH = String(Math.floor(endMin / 60)).padStart(2, "0")
    const endM = String(endMin % 60).padStart(2, "0")

    const disc = (s as any).disciplines?.name || "Séance"
    const studio = (s as any).studios?.name || ""
    const location = [s.room, studio].filter(Boolean).join(" — ")

    lines.push(
      "BEGIN:VEVENT",
      `UID:${s.id}@fydelys.fr`,
      `DTSTART:${date}T${time}`,
      `DTEND:${date}T${endH}${endM}00`,
      `SUMMARY:${disc}`,
      `DESCRIPTION:${disc} avec ${s.teacher || ""}`.trim(),
      location ? `LOCATION:${location}` : "",
      `STATUS:CONFIRMED`,
      "END:VEVENT",
    )
  }

  lines.push("END:VCALENDAR")
  return lines.filter(Boolean).join("\r\n")
}
