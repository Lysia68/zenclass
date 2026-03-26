import { NextRequest, NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

// GET /api/export?type=members|payments|sessions&studioId=xxx
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type")
  const studioId = req.nextUrl.searchParams.get("studioId")

  if (!type || !studioId) {
    return NextResponse.json({ error: "type et studioId requis" }, { status: 400 })
  }

  const db = createServiceSupabase()

  let csv = ""
  const today = new Date().toISOString().slice(0, 10)

  if (type === "members") {
    const { data } = await db.from("members")
      .select("first_name, last_name, email, phone, status, credits, credits_total, joined_at, birth_date, subscriptions(name)")
      .eq("studio_id", studioId)
      .order("last_name")

    csv = "Prénom;Nom;Email;Téléphone;Statut;Crédits;Crédits total;Abonnement;Date inscription;Date naissance\n"
    for (const m of data || []) {
      const sub = (m as any).subscriptions?.name || ""
      csv += [
        m.first_name, m.last_name, m.email, m.phone || "",
        m.status, m.credits ?? "", m.credits_total ?? "", sub,
        m.joined_at?.slice(0, 10) || "", m.birth_date || "",
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(";") + "\n"
    }
  } else if (type === "payments") {
    const { data } = await db.from("payments")
      .select("amount, payment_date, payment_type, status, notes, members(first_name, last_name), subscriptions(name)")
      .eq("studio_id", studioId)
      .order("payment_date", { ascending: false })

    csv = "Adhérent;Montant;Date;Mode;Statut;Abonnement;Notes\n"
    for (const p of data || []) {
      const member = (p as any).members
      const memberName = member ? `${member.first_name || ""} ${member.last_name || ""}`.trim() : ""
      const sub = (p as any).subscriptions?.name || ""
      csv += [
        memberName, p.amount, p.payment_date || "", p.payment_type || "",
        p.status, sub, p.notes || "",
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(";") + "\n"
    }
  } else if (type === "sessions") {
    const { data } = await db.from("sessions")
      .select("session_date, session_time, duration_min, teacher, room, spots, status, disciplines(name)")
      .eq("studio_id", studioId)
      .order("session_date", { ascending: false })

    csv = "Date;Heure;Durée (min);Discipline;Coach;Salle;Places;Statut\n"
    for (const s of data || []) {
      const disc = (s as any).disciplines?.name || ""
      csv += [
        s.session_date, s.session_time?.slice(0, 5) || "", s.duration_min,
        disc, s.teacher || "", s.room || "", s.spots, s.status,
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(";") + "\n"
    }
  } else {
    return NextResponse.json({ error: "Type invalide (members|payments|sessions)" }, { status: 400 })
  }

  // BOM UTF-8 pour Excel
  const bom = "\uFEFF"
  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="fydelys-${type}-${today}.csv"`,
    },
  })
}
