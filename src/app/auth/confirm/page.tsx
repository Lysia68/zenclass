"use client"
import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"

export default function AuthConfirmPage() {
  const [status, setStatus] = useState("Initialisation…")
  const [detail, setDetail] = useState("")
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    const hash      = window.location.hash
    const params    = new URLSearchParams(window.location.search)
    const tenant    = params.get("tenant")
    const tokenHash = params.get("token_hash")
    const type      = params.get("type") || "magiclink"

    setDetail(`hash=${hash.slice(0,40)||"(vide)"} | tenant=${tenant||"(vide)"} | token_hash=${tokenHash||"(vide)"}`)

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { flowType: "implicit" } }
    )

    async function handleSession(user: any) {
      setStatus("Session OK — création profil…")
      const tenantSlug = tenant || user.app_metadata?.studio_slug

      if (!tenantSlug) {
        setStatus("Redirection admin…")
        window.location.href = "https://fydelys.fr/dashboard"
        return
      }

      try {
        const res = await fetch("/api/create-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId:       user.id,
            userEmail:    user.email,
            userMetadata: user.user_metadata,
            tenantSlug,
          }),
        })
        const result = await res.json()
        if (!res.ok) {
          setIsError(true)
          setStatus(`Erreur create-profile: ${result.error}`)
          return
        }
        const slug = result.slug || tenantSlug
        setStatus(`Redirection vers ${slug}.fydelys.fr…`)
        window.location.href = `https://${slug}.fydelys.fr/dashboard`
      } catch(e: any) {
        setIsError(true)
        setStatus(`Erreur réseau: ${e.message}`)
      }
    }

    // Flow 1 : token_hash dans les query params
    if (tokenHash) {
      setStatus("Vérification token_hash…")
      supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as any })
        .then(async ({ data, error }) => {
          if (error || !data?.user) {
            setIsError(true)
            setStatus(`verifyOtp échoué: ${error?.message || "no_user"}`)
            setTimeout(() => { window.location.href = "/login?error=lien_expire" }, 3000)
            return
          }
          await handleSession(data.user)
        })
      return
    }

    // Flow 2 : #access_token dans le hash
    if (!hash || !hash.includes("access_token=")) {
      setIsError(true)
      setStatus("Aucun token trouvé — lien expiré ou déjà utilisé")
      setTimeout(() => { window.location.href = "/login?error=lien_expire" }, 3000)
      return
    }

    setStatus("Lecture access_token depuis le hash…")
    const hp           = new URLSearchParams(hash.replace("#", ""))
    const accessToken  = hp.get("access_token")
    const refreshToken = hp.get("refresh_token")

    if (!accessToken || !refreshToken) {
      setIsError(true)
      setStatus("access_token ou refresh_token manquant")
      setTimeout(() => { window.location.href = "/login?error=lien_expire" }, 3000)
      return
    }

    setStatus("setSession en cours…")
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(async ({ data, error }) => {
        if (error || !data?.user) {
          setIsError(true)
          setStatus(`setSession échoué: ${error?.message || "no_user"}`)
          setTimeout(() => { window.location.href = "/login?error=lien_expire" }, 3000)
          return
        }
        await handleSession(data.user)
      })
  }, [])

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#F4EFE8", fontFamily:"system-ui,sans-serif", padding:20 }}>
      <div style={{ textAlign:"center", maxWidth:500 }}>
        <div style={{ fontSize:32, marginBottom:16 }}>{isError ? "❌" : "✦"}</div>
        <div style={{ fontSize:16, color: isError ? "#C0392B" : "#5C4A38", fontWeight:600, marginBottom:8 }}>
          {status}
        </div>
        <div style={{ fontSize:11, color:"#B0A090", marginTop:8, wordBreak:"break-all", background:"#EDE4D8", padding:"8px 12px", borderRadius:8 }}>
          {detail}
        </div>
        {isError && (
          <a href="/login" style={{ display:"inline-block", marginTop:20, fontSize:13, color:"#9A6030", textDecoration:"underline" }}>
            Retour à la connexion
          </a>
        )}
      </div>
    </div>
  )
}