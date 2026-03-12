import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const isProduction = typeof window !== "undefined" && window.location.hostname.includes("fydelys.fr")
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Implicit flow : Supabase envoie #access_token dans le hash
        // PKCE cause des problèmes cross-domain (code_verifier lié au sous-domaine)
        flowType: "implicit",
      },
      cookieOptions: {
        domain: isProduction ? ".fydelys.fr" : undefined,
        sameSite: "lax",
        secure: isProduction,
        path: "/",
      },
    }
  )
}