import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        // Partager la session sur fydelys.fr ET tous les sous-domaines
        domain: typeof window !== "undefined" && window.location.hostname.includes("fydelys.fr")
          ? ".fydelys.fr"
          : undefined,
        sameSite: "lax",
        secure: true,
      }
    }
  )
}
