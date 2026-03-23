import { NextRequest, NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

// Enregistre une inscription en attente et envoie le magic link
// Rate limit simple en mémoire (reset au redémarrage)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export async function POST(req: NextRequest) {
  try {
    // Rate limit : max 3 inscriptions par IP par heure
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const now = Date.now()
    const limit = rateLimitMap.get(ip)
    if (limit && now < limit.resetAt) {
      if (limit.count >= 3) {
        console.warn("[register] Rate limit atteint pour", ip)
        return NextResponse.json({ error: "Trop de tentatives, réessayez dans 1 heure" }, { status: 429 })
      }
      limit.count++
    } else {
      rateLimitMap.set(ip, { count: 1, resetAt: now + 3600_000 })
    }

    const { email, studioName, slug, city, zip, address, type, firstName, lastName, phone, isCoach } = await req.json()
    if (!email || !slug || !studioName) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 })
    }

    const db = createServiceSupabase()

    // Vérifier slug disponible
    const { data: slugExists } = await db.from("studios").select("id").eq("slug", slug).maybeSingle()
    if (slugExists) return NextResponse.json({ error: "Ce sous-domaine est déjà pris" }, { status: 409 })

    // Enregistrer l'inscription en attente via service role (contourne RLS)
    const { error: upsertErr } = await db.from("pending_registrations").upsert({
      email,
      data: { studioName, slug, city, zip: zip || null, address: address || null, type, firstName, lastName, phone, isCoach },
      expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    }, { onConflict: "email" })

    if (upsertErr) {
      console.error("[register] upsert error:", upsertErr.message)
      return NextResponse.json({ error: "Erreur lors de l'enregistrement" }, { status: 500 })
    }

    // Envoyer le magic link via Supabase Admin
    const { error: otpErr } = await db.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `https://fydelys.fr/auth/callback?next=/dashboard&register=1`,
        data: { first_name: firstName, last_name: lastName },
      },
    })

    if (otpErr) {
      console.error("[register] generateLink error:", otpErr.message)
      // Fallback: signInWithOtp via anon
      return NextResponse.json({ ok: true, fallback: true })
    }

    console.log("[register] Inscription enregistrée pour", email, "| studio:", slug)
    return NextResponse.json({ ok: true })

  } catch (err: any) {
    console.error("[register] error:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
