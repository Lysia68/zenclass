"use client"
export const dynamic = "force-dynamic"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import dynamic from "next/dynamic"

const FydelysV4 = dynamic(() => import("@/components/FydelysV4"), { ssr: false })

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createClient()
  const [initialRole, setInitialRole]           = useState<string | null>(null)
  const [studioSlug, setStudioSlug]             = useState<string>("")
  const [coachName, setCoachName]               = useState<string>("")
  const [coachDisciplines, setCoachDisciplines] = useState<any[]>([])
  const [isApp, setIsApp]                       = useState(false) // pour la couleur de fond loading

  useEffect(() => {
    // Tout accès à window EST dans useEffect — jamais au niveau module/rendu
    const hostname    = window.location.hostname
    const isAppHost   = hostname.startsWith("app.") || hostname === "localhost" || hostname === "localhost:3000"
    const tenantMatch = hostname.match(/^([a-z0-9-]+)\.fydelys\.fr/)
    const slug        = tenantMatch ? tenantMatch[1] : ""

    setIsApp(isAppHost)
    setStudioSlug(slug)

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/"); return }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, studio_id, first_name, last_name, is_coach")
        .eq("id", user.id)
        .single()

      const role = profile?.role || "adherent"

      // Nom + disciplines pour les coachs
      if (role === "coach" || profile?.is_coach) {
        const fullName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim()
        setCoachName(fullName)
        const { data: discLinks } = await supabase
          .from("coach_disciplines")
          .select("discipline_id, disciplines(id, name, icon, color)")
          .eq("profile_id", user.id)
        if (discLinks) {
          setCoachDisciplines(discLinks.map((r: any) => r.disciplines).filter(Boolean))
        }
      }

      if (isAppHost) {
        if (role === "superadmin") {
          setInitialRole("superadmin")
        } else if (role === "admin") {
          const { data: studio } = await supabase
            .from("studios").select("slug").eq("id", profile?.studio_id).single()
          if (studio?.slug) {
            window.location.href = `https://${studio.slug}.fydelys.fr/dashboard`
          } else {
            setInitialRole("admin")
          }
        } else {
          router.push("/")
        }
      } else if (slug) {
        if (role === "superadmin") {
          window.location.href = "https://app.fydelys.fr/dashboard"
          return
        }
        setInitialRole(role)
      } else {
        setInitialRole(role)
      }
    })
  }, [])

  // Loading — pas de window ici, on utilise le state isApp
  if (!initialRole) return (
    <div style={{
      minHeight: "100vh",
      background: isApp ? "#0F0A1E" : "#F4EFE8",
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{ fontFamily: "Arial", color: "#A06838", fontSize: 16, fontWeight: 600 }}>
        Chargement…
      </div>
    </div>
  )

  return (
    <FydelysV4
      initialRole={initialRole}
      studioSlug={studioSlug}
      coachName={coachName}
      coachDisciplines={coachDisciplines}
    />
  )
}
