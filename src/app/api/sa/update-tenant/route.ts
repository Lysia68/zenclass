import { NextRequest, NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

// PATCH /api/sa/studios — update a tenant (superadmin only)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { studioId, studio, profile } = body

    if (!studioId) {
      return NextResponse.json({ error: "studioId requis" }, { status: 400 })
    }

    const db = createServiceSupabase()

    // Vérifier que l'appelant est superadmin (via cookie)
    const { createServerClient } = await import("@supabase/ssr")
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return request.cookies.getAll() }, setAll() {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const { data: caller } = await db.from("profiles").select("role").eq("id", user.id).single()
    if (caller?.role !== "superadmin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Mettre à jour le studio
    if (studio) {
      const { error: studioErr } = await db.from("studios").update(studio).eq("id", studioId)
      if (studioErr) {
        console.error("[sa/studios PATCH] studio update error:", studioErr.message)
        return NextResponse.json({ error: studioErr.message }, { status: 500 })
      }
    }

    // Mettre à jour le profil admin du studio
    if (profile) {
      const { error: profileErr } = await db.from("profiles")
        .update(profile)
        .eq("studio_id", studioId)
        .eq("role", "admin")
      if (profileErr) {
        console.error("[sa/studios PATCH] profile update error:", profileErr.message)
        return NextResponse.json({ error: profileErr.message }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("[sa/studios PATCH] error:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}