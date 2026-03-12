"use client"
import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"

export default function AuthConfirmPage() {
  const [status, setStatus] = useState("Connexion en cours…")
  const [detail, setDetail] = useState("")
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    const hash      = window.location.hash
    const params    = new URLSearchParams(window.location.search)
    const tenant    = params.get("tenant")
    const code      = params.get("code")
    const tokenHash = params.get("token_hash")
    const type      = params.get("type") || "magiclink"

    setDetail(`code=${code?"oui":"non"} | hash=${hash.includes("access_token")?"oui":"non"} | token_hash=${tokenHash?"oui":"non"} | tenant=${tenant||"(vide)"}`)

    const isProduction = window.location.hostname.includes("fydelys.fr")
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions: {
          domain: isProduction ? ".fydelys.fr" : undefined,
          sameSite: "lax",
          secure: isProduction,
          path: "/",
        },
      }
    )

    function redirectFinal(slug: string) {
      window.location.href = `https://${slug}.fydelys.fr/dashboard`
    }

    // ── Flow 1 : ?code= (PKCE — Supabase envoie ça après /verify) ───────────
    if (code) {
      setStatus("Échange du code PKCE…")
      fetch("/api/exchange-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, tenantSlug: tenant }),
      }).then(async (res) => {
        const result = await res.json()
        if (!res.ok || !result.ok) {
          setIsError(true)
          setStatus(`Erreur: ${result.error || "exchange_failed"}`)
          setTimeout(() => { window.location.href = "/login?error=lien_expire" }, 3000)
          return
        }
        setStatus(`Redirection…`)
        const slug = result.slug || tenant
        if (!slug) {
          window.location.href = "https://fydelys.fr/dashboard"
        } else {
          redirectFinal(slug)
        }
      }).catch(e => {
        setIsError(true)
        setStatus(`Erreur réseau: ${e.message}`)
      })
      return
    }

    // ── Flow 2 : ?token_hash= (lien reconstruit via generateLink) ───────────
    if (tokenHash) {
      setStatus("Vérification token…")
      supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as any })
        .then(async ({ data, error }) => {
          if (error || !data?.user) {
            setIsError(true)
            setStatus(`Erreur: ${error?.message || "no_user"}`)
            setTimeout(() => { window.location.href = "/login?error=lien_expire" }, 3000)
            return
          }
          await handleSessionClient(data.user)
        })
      return
    }

    // ── Flow 3 : #access_token= (flow implicit) ──────────────────────────────
    if (hash && hash.includes("access_token=")) {
      setStatus("Lecture du token…")
      const hp           = new URLSearchParams(hash.replace("#", ""))
      const accessToken  = hp.get("access_token")
      const refreshToken = hp.get("refresh_token")
      if (!accessToken || !refreshToken) {
        setIsError(true)
        setStatus("Token manquant dans le hash")
        setTimeout(() => { window.location.href = "/login?error=lien_expire" }, 3000)
        return
      }
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(async ({ data, error }) => {
          if (error || !data?.user) {
            setIsError(true)
            setStatus(`setSession échoué: ${error?.message}`)
            setTimeout(() => { window.location.href = "/login?error=lien_expire" }, 3000)
            return
          }
          await handleSessionClient(data.user)
        })
      return
    }

    // Aucun token trouvé
    setIsError(true)
    setStatus("Aucun token trouvé — lien expiré ou déjà utilisé")
    setTimeout(() => { window.location.href = "/login?error=lien_expire" }, 3000)

    async function handleSessionClient(user: any) {
      const tenantSlug = tenant || user.app_metadata?.studio_slug
      if (!tenantSlug) {
        setStatus("Redirection admin…")
        window.location.href = "https://fydelys.fr/dashboard"
        return
      }
      setStatus("Création du profil…")
      const res = await fetch("/api/create-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id, userEmail: user.email,
          userMetadata: user.user_metadata, tenantSlug,
        }),
      })
      const result = await res.json()
      redirectFinal(result.slug || tenantSlug)
    }
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