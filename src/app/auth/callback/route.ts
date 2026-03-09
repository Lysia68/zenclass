import { createServerSupabase } from "@/lib/supabase-server"
import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  if (code) {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Créer le profil s'il n'existe pas encore
      await supabase.from("profiles").upsert({
        id: data.user.id,
        first_name: data.user.user_metadata?.first_name ?? "",
        last_name: data.user.user_metadata?.last_name ?? "",
        role: "admin",
      }, { onConflict: "id", ignoreDuplicates: true })
    }
  }

  return NextResponse.redirect(new URL(next, request.url))
}
