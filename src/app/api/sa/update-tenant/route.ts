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

// DELETE /api/sa/update-tenant — delete a tenant and all related data (superadmin only)
export async function DELETE(request: NextRequest) {
  try {
    const { studioId } = await request.json()
    if (!studioId) return NextResponse.json({ error: "studioId requis" }, { status: 400 })

    const db = createServiceSupabase()

    // Vérifier superadmin
    const { createServerClient } = await import("@supabase/ssr")
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return request.cookies.getAll() }, setAll() {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const { data: caller } = await db.from("profiles").select("role").eq("id", user.id).single()
    if (caller?.role !== "superadmin") return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

    // ── Collecter tous les auth_user_id liés à ce studio ──
    const authUserIds = new Set<string>()

    // Depuis profiles (admin, coach, adherent liés au studio)
    const { data: profiles } = await db.from("profiles").select("id").eq("studio_id", studioId)
    if (profiles) profiles.forEach(p => authUserIds.add(p.id))

    // Depuis members (adhérents qui ont un auth_user_id)
    const { data: members } = await db.from("members").select("auth_user_id").eq("studio_id", studioId).not("auth_user_id", "is", null)
    if (members) members.forEach(m => { if (m.auth_user_id) authUserIds.add(m.auth_user_id) })

    // Ne pas supprimer le superadmin lui-même
    authUserIds.delete(user.id)

    console.log("[sa/studios DELETE] Studio:", studioId, "| auth users to delete:", authUserIds.size)

    // ── Supprimer le studio (CASCADE supprime profiles, members, sessions, bookings, etc.) ──
    const { error } = await db.from("studios").delete().eq("id", studioId)
    if (error) {
      console.error("[sa/studios DELETE] studio delete error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ── Supprimer les auth.users (après le studio pour éviter les FK conflicts) ──
    let deletedUsers = 0
    for (const uid of authUserIds) {
      const { error: authErr } = await db.auth.admin.deleteUser(uid)
      if (authErr) {
        console.warn("[sa/studios DELETE] auth user delete failed:", uid, authErr.message)
      } else {
        deletedUsers++
      }
    }

    // ── Nettoyer les pending_registrations liées à l'email du studio ──
    const { data: studioData } = await db.from("studios").select("email").eq("id", studioId).maybeSingle()
    if (studioData?.email) {
      await db.from("pending_registrations").delete().eq("email", studioData.email)
    }

    console.log("[sa/studios DELETE] Done — studio:", studioId, "| users deleted:", deletedUsers)
    return NextResponse.json({ ok: true, deletedUsers })
  } catch (err: any) {
    console.error("[sa/studios DELETE] error:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}