import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || ""
  const { pathname, searchParams } = request.nextUrl

  // ── Détecter le contexte domaine ─────────────────────────────────────────────
  const isApp      = hostname.startsWith("app.fydelys.fr") || hostname.startsWith("app.localhost")
  const isLocal    = hostname === "localhost:3000" || hostname === "localhost"
  const tenantSlug = (() => {
    if (isApp || isLocal) return null
    const match = hostname.match(/^([a-z0-9-]+)\.fydelys\.fr/)
    return match ? match[1] : null
  })()
  const isTenant = !!tenantSlug

  // Injecter le contexte dans les headers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-tenant-slug",  tenantSlug || "")
  requestHeaders.set("x-is-app",       isApp ? "1" : "0")
  requestHeaders.set("x-is-tenant",    isTenant ? "1" : "0")
  requestHeaders.set("x-hostname",     hostname)

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })
  const setHeaders = (res: NextResponse) => {
    res.headers.set("x-tenant-slug",  tenantSlug || "")
    res.headers.set("x-is-app",       isApp ? "1" : "0")
    res.headers.set("x-is-tenant",    isTenant ? "1" : "0")
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })
          setHeaders(supabaseResponse)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/planning") ||
                      pathname.startsWith("/members") || pathname.startsWith("/subscriptions") ||
                      pathname.startsWith("/payments") || pathname.startsWith("/disciplines") ||
                      pathname.startsWith("/settings")

  // Auth guard
  if (!user && isProtected) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // SuperAdmin sur domaine tenant → rediriger vers app.fydelys.fr
  if (user && isTenant && isProtected) {
    const { data: profile } = await supabase
      .from("profiles").select("role, studio_id").eq("id", user.id).single()
    if (profile?.role === "superadmin") {
      return NextResponse.redirect(new URL(`https://app.fydelys.fr/dashboard`, request.url))
    }

    // ── Billing guard : vérifier l'accès du studio ──────────────────────────
    // (uniquement pour les admins sur pages protégées, hors /billing lui-même)
    if (profile?.role === "admin" && !pathname.startsWith("/billing")) {
      const { data: studio } = await supabase
        .from("studios")
        .select("billing_status, trial_ends_at")
        .eq("id", profile.studio_id)
        .single()

      if (studio) {
        const { billing_status, trial_ends_at } = studio
        const trialExpired = billing_status === "trialing" &&
          trial_ends_at && new Date(trial_ends_at) < new Date()
        const isBlocked = ["canceled","suspended"].includes(billing_status) || trialExpired

        if (isBlocked) {
          const billingUrl = new URL("/billing", request.url)
          billingUrl.searchParams.set("reason", trialExpired ? "trial_expired" : billing_status)
          return NextResponse.redirect(billingUrl)
        }
      }
    }
  }

  // Rediriger / → /dashboard si connecté
  if (user && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  setHeaders(supabaseResponse)
  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
