import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

const DISC_DEFAULTS: Record<string, { name: string; icon: string }[]> = {
  Yoga:       [{ name: "Yoga Vinyasa", icon: "🧘" }, { name: "Yin Yoga", icon: "🌙" }, { name: "Méditation", icon: "☯" }],
  Pilates:    [{ name: "Pilates Mat", icon: "⚡" }, { name: "Pilates Réformateur", icon: "🏋" }, { name: "Stretching", icon: "🤸" }],
  Danse:      [{ name: "Danse Contemporaine", icon: "💃" }, { name: "Hip-Hop", icon: "🎵" }, { name: "Classique", icon: "🩰" }],
  Fitness:    [{ name: "HIIT", icon: "🔥" }, { name: "Cardio", icon: "❤️" }, { name: "Musculation", icon: "💪" }],
  Méditation: [{ name: "Méditation", icon: "☯" }, { name: "Yin Yoga", icon: "🌙" }, { name: "Yoga Vinyasa", icon: "🧘" }],
  Multi:      [{ name: "Yoga Vinyasa", icon: "🧘" }, { name: "Pilates Mat", icon: "⚡" }, { name: "Méditation", icon: "☯" }],
}

const DEFAULT_SUBSCRIPTIONS = [
  { name: "Séance à l'unité",  price: 25,  period: "séance",    description: "Idéal pour découvrir",                popular: false, color: "#6A8FAE" },
  { name: "Carnet 10 séances", price: 120, period: "carnet",    description: "Valable 6 mois, toutes disciplines",  popular: false, color: "#6B9E7A" },
  { name: "Mensuel illimité",  price: 89,  period: "mois",      description: "Accès illimité à toutes les séances", popular: true,  color: "#C4956A" },
  { name: "Trimestriel",       price: 240, period: "trimestre", description: "3 mois d'accès illimité, -10%",       popular: false, color: "#AE7A7A" },
]

export async function POST(request: NextRequest) {
  const { tokenHash, type, tenantSlug, accessToken, refreshToken, isRegister, registerSlug } = await request.json()
  if (!tokenHash && !accessToken) return NextResponse.json({ error: "token manquant" }, { status: 400 })

  const db = createServiceSupabase()
  const cookiesToSet: any[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(list) { cookiesToSet.push(...list) },
      },
    }
  )

  const { data, error } = tokenHash
    ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type || "magiclink" })
    : await supabase.auth.setSession({ access_token: accessToken!, refresh_token: refreshToken! })

  if (error || !data?.user) {
    return NextResponse.json({ error: error?.message || "verify_failed" }, { status: 401 })
  }

  const user = data.user
  let profileComplete = true
  let slug = tenantSlug || registerSlug || null

  // ── Inscription studio : créer le studio depuis pending_registrations ──
  // On vérifie pending_registrations si :
  // - pas de slug (fallback classique)
  // - OU isRegister est true (inscription en cours, le studio n'existe peut-être pas encore)
  const shouldCheckPending = (!slug || isRegister) && user.email
  if (shouldCheckPending) {
    const { data: pending } = await db.from("pending_registrations").select("data").eq("email", user.email).maybeSingle()
    if (pending?.data) {
      const r = pending.data as any
      slug = r.slug || slug
      console.log("[verify-token] slug from pending_registrations:", slug)

      // Créer le studio si pas encore créé
      if (slug) {
        const { data: existingStudio } = await db.from("studios").select("id,slug").eq("slug", slug).maybeSingle()
        if (!existingStudio) {
          const trialEnd = new Date(); trialEnd.setDate(trialEnd.getDate() + 30)
          const { data: studio, error: studioErr } = await db.from("studios").insert({
            name: r.studioName, slug: r.slug, city: r.city,
            postal_code: r.zip || null, address: r.address || null,
            email: user.email, phone: r.phone || null, status: "actif",
            billing_status: "trialing",
            trial_ends_at: trialEnd.toISOString().slice(0, 10),
            plan_started_at: new Date().toISOString(),
            plan_slug: "essentiel",
          }).select().single()

          if (studioErr) {
            console.error("[verify-token] Studio insert error:", studioErr.message)
          } else if (studio) {
            console.log("[verify-token] Studio créé:", studio.slug)
            // Créer le profil admin
            await db.from("profiles").upsert({
              id: user.id, role: "admin", studio_id: studio.id,
              first_name: r.firstName || "", last_name: r.lastName || "",
              is_coach: r.isCoach || false,
            }, { onConflict: "id" })

            // Créer les disciplines choisies lors de l'onboarding (ou défaut par type)
            const discs = (r.disciplines && r.disciplines.length > 0)
              ? r.disciplines
              : (DISC_DEFAULTS[r.type] || DISC_DEFAULTS.Multi)
            for (const d of discs) {
              await db.from("disciplines").insert({
                studio_id: studio.id, name: d.name, icon: d.icon || "🧘",
              })
            }
            console.log("[verify-token] Disciplines créées:", discs.length)

            // Abonnements standard
            await db.from("subscriptions").insert(
              DEFAULT_SUBSCRIPTIONS.map(s => ({ studio_id: studio.id, ...s }))
            ).then(({ error: subErr }) => {
              if (subErr) console.error("[verify-token] Subscriptions error:", subErr.message)
              else console.log("[verify-token] Subscriptions OK")
            })

            // Nettoyer pending_registrations
            await db.from("pending_registrations").delete().eq("email", user.email)
          }
        } else {
          console.log("[verify-token] Studio déjà existant:", existingStudio.slug)
          // Vérifier que le profil existe
          const { data: prof } = await db.from("profiles").select("id").eq("id", user.id).maybeSingle()
          if (!prof) {
            await db.from("profiles").upsert({
              id: user.id, role: "admin", studio_id: existingStudio.id,
              first_name: r.firstName || "", last_name: r.lastName || "",
            }, { onConflict: "id" })
          }
          await db.from("pending_registrations").delete().eq("email", user.email)
        }
      }
    }
  }

  if (tenantSlug && !isRegister) {
    const { data: studio } = await db.from("studios").select("id,slug").eq("slug", tenantSlug).single()
    if (studio) {
      const { data: existing } = await db.from("profiles").select("role,studio_id").eq("id", user.id).maybeSingle()
      const { data: invite } = await db.from("invitations")
        .select("role").eq("email", user.email!).eq("studio_id", studio.id).eq("used", false).maybeSingle()

      // Déterminer le bon rôle : invitation > metadata > adherent par défaut
      // Sur un sous-domaine, jamais "admin" sauf invitation explicite
      const intendedRole = invite?.role || user.user_metadata?.role || "adherent"
      const safeRole = (intendedRole === "admin" || intendedRole === "superadmin") ? "adherent" : intendedRole

      if (!existing) {
        // Nouveau profil
        console.log("[verify-token] Creating profile role:", safeRole, "for", user.email)
        await db.from("profiles").insert({
          id: user.id, role: safeRole, studio_id: studio.id,
          first_name: user.user_metadata?.first_name || "",
          last_name:  user.user_metadata?.last_name  || "",
          is_coach: safeRole === "coach",
        })
        if (invite) {
          await db.from("invitations").update({ used: true })
            .eq("email", user.email!).eq("studio_id", studio.id)
        }
      } else if (existing.role === "admin" && existing.studio_id !== studio.id) {
        // Profil admin créé par erreur pour un studio différent — corriger en adherent
        console.warn("[verify-token] Correcting wrong admin profile for", user.email, "→ adherent")
        await db.from("profiles").update({ role: "adherent", studio_id: studio.id }).eq("id", user.id)
      }

      // Créer/lier le membre si adherent ou coach
      const finalRole = !existing ? safeRole : (existing.role === "admin" && existing.studio_id !== studio.id ? "adherent" : existing.role)
      if (finalRole === "adherent") {
        const { data: existingMember } = await db.from("members")
          .select("id,profile_complete").eq("studio_id", studio.id).eq("email", user.email!).maybeSingle()
        if (existingMember) {
          await db.from("members").update({ auth_user_id: user.id }).eq("id", existingMember.id)
          profileComplete = existingMember.profile_complete ?? false
        } else {
          await db.from("members").insert({
            studio_id: studio.id, auth_user_id: user.id,
            first_name: user.user_metadata?.first_name || "Nouveau",
            last_name:  user.user_metadata?.last_name  || "Membre",
            email: user.email!, status: "nouveau", credits: 0, credits_total: 0,
            profile_complete: false,
          })
          profileComplete = false
        }
        console.log("[verify-token] member profileComplete:", profileComplete, "for", user.email)
      }
    }
  }

  console.log("[verify-token] returning slug:", slug, "| profile_complete:", profileComplete)
  const res = NextResponse.json({ ok: true, slug, profile_complete: profileComplete })
  // Poser les cookies avec domain .fydelys.fr
  cookiesToSet.forEach(({ name, value, options }) => {
    res.cookies.set(name, value, {
      ...options,
      domain: ".fydelys.fr",
      path: "/",
      sameSite: "lax",
      secure: true,
    })
  })
  return res
}