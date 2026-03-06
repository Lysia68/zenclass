"use client"
import { useState } from "react"
import { createClient } from "@/lib/supabase"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#F4EFE8",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 24
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            width: 68, height: 68, borderRadius: 20,
            background: "linear-gradient(135deg, #B07848 0%, #D4A574 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 30, margin: "0 auto 18px",
            boxShadow: "0 8px 32px rgba(176,120,72,.25)"
          }}>🧘</div>
          <h1 style={{
            fontSize: 28, fontWeight: 800, color: "#2A1F14",
            margin: "0 0 8px", fontFamily: "Inter, sans-serif", letterSpacing: -0.6
          }}>ZenClass</h1>
          <p style={{ color: "#8C7B6C", fontSize: 14, margin: 0, fontFamily: "Inter, sans-serif" }}>
            Gérez votre studio de yoga
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "#fff", border: "1px solid #DDD5C8",
          borderRadius: 18, padding: "32px 28px",
          boxShadow: "0 4px 24px rgba(42,31,20,.06)"
        }}>
          {!sent ? (
            <>
              <p style={{
                fontSize: 14, color: "#5C4A38", marginBottom: 24,
                fontFamily: "Inter, sans-serif", lineHeight: 1.6
              }}>
                Entrez votre email — nous vous envoyons un <strong>lien de connexion magique</strong> valable 1h.
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{
                    display: "block", fontSize: 11, fontWeight: 700,
                    color: "#8C7B6C", letterSpacing: 0.8, textTransform: "uppercase",
                    marginBottom: 6, fontFamily: "Inter, sans-serif"
                  }}>Adresse email</label>
                  <input
                    type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="vous@studio.com" required
                    style={{
                      width: "100%", padding: "12px 14px",
                      border: "1.5px solid #DDD5C8", borderRadius: 10,
                      fontFamily: "Inter, sans-serif", fontSize: 15,
                      outline: "none", color: "#2A1F14", background: "#FBF8F4",
                      boxSizing: "border-box", transition: "border-color .15s"
                    }}
                    onFocus={e => e.target.style.borderColor = "#B07848"}
                    onBlur={e => e.target.style.borderColor = "#DDD5C8"}
                  />
                </div>

                {error && (
                  <div style={{
                    background: "#F5EAE6", border: "1px solid #E8C8C0",
                    borderRadius: 8, padding: "10px 14px", marginBottom: 16,
                    fontSize: 13, color: "#A85030", fontFamily: "Inter, sans-serif"
                  }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading || !email} style={{
                  width: "100%", padding: "13px",
                  background: loading || !email ? "#C4A882" : "#B07848",
                  color: "#fff", border: "none", borderRadius: 10,
                  fontSize: 15, fontWeight: 700, cursor: loading || !email ? "not-allowed" : "pointer",
                  fontFamily: "Inter, sans-serif", letterSpacing: -0.2,
                  transition: "background .2s"
                }}>
                  {loading ? "Envoi en cours…" : "Recevoir le lien ✉️"}
                </button>
              </form>
            </>
          ) : (
            /* Success state */
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ fontSize: 52, marginBottom: 18 }}>📬</div>
              <h2 style={{
                fontSize: 20, fontWeight: 800, color: "#2A1F14",
                marginBottom: 10, fontFamily: "Inter, sans-serif", letterSpacing: -0.4
              }}>Vérifiez vos emails !</h2>
              <p style={{
                fontSize: 14, color: "#5C4A38", lineHeight: 1.7,
                fontFamily: "Inter, sans-serif", marginBottom: 24
              }}>
                Un lien de connexion a été envoyé à<br />
                <strong>{email}</strong>
              </p>
              <p style={{ fontSize: 12, color: "#B0A090", fontFamily: "Inter, sans-serif" }}>
                Le lien expire dans 1 heure.<br />
                Vérifiez aussi vos spams.
              </p>
              <button
                onClick={() => { setSent(false); setEmail("") }}
                style={{
                  marginTop: 20, background: "none", border: "1.5px solid #DDD5C8",
                  borderRadius: 8, padding: "8px 20px", cursor: "pointer",
                  fontSize: 13, color: "#8C7B6C", fontFamily: "Inter, sans-serif", fontWeight: 500
                }}>
                ← Changer d'email
              </button>
            </div>
          )}
        </div>

        <p style={{
          textAlign: "center", color: "#B0A090", fontSize: 12,
          marginTop: 24, fontFamily: "Inter, sans-serif"
        }}>
          © 2026 ZenClass · Connexion sécurisée sans mot de passe
        </p>
      </div>
    </div>
  )
}
