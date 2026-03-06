"use client"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase"
import Link from "next/link"

const NAV = [
  { key: "dashboard",     label: "Tableau de bord", icon: "◉", href: "/dashboard" },
  { key: "planning",      label: "Planning",         icon: "▤", href: "/planning" },
  { key: "members",       label: "Adhérents",        icon: "◎", href: "/members" },
  { key: "subscriptions", label: "Abonnements",      icon: "◈", href: "/subscriptions" },
  { key: "payments",      label: "Paiements",        icon: "◆", href: "/payments" },
  { key: "disciplines",   label: "Disciplines",      icon: "❋", href: "/disciplines" },
  { key: "settings",      label: "Paramètres",       icon: "⚙", href: "/settings" },
]
const MOBILE_NAV = [NAV[0], NAV[1], NAV[2], NAV[4], NAV[6]]

const C = {
  bg: "#F4EFE8", surface: "#FFFFFF", border: "#DDD5C8", borderSoft: "#EAE4DA",
  accent: "#B07848", accentBg: "#F5EBE0", accentLight: "#F9F1E8",
  text: "#2A1F14", textMid: "#5C4A38", textSoft: "#8C7B6C", textMuted: "#B0A090",
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [userName, setUserName] = useState("Admin")
  const [studioName, setStudioName] = useState("Mon Studio")

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/"); return }
      // Load profile
      supabase.from("profiles").select("first_name, last_name, studios(name)").eq("id", user.id).single()
        .then(({ data }) => {
          if (data) {
            setUserName(`${data.first_name || ""} ${data.last_name || ""}`.trim() || "Admin")
            const s = data.studios as any
            if (s?.name) setStudioName(s.name)
          }
        })
    })
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    router.push("/")
  }

  const active = NAV.find(n => pathname?.startsWith(n.href))?.key || "dashboard"

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: "Inter, -apple-system, sans-serif" }}>
      {/* ── SIDEBAR (desktop) ── */}
      <aside style={{ width: 220, background: C.surface, borderRight: `1px solid ${C.border}`, minHeight: "100vh", display: "flex", flexDirection: "column", flexShrink: 0 }}
        className="hidden md:flex">
        {/* Logo */}
        <div style={{ padding: "22px 18px 16px" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: -0.5 }}>
            Zen<span style={{ color: C.accent }}>Class</span>
          </div>
          <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: 2, textTransform: "uppercase", marginTop: 3 }}>Studio Manager</div>
        </div>

        {/* Studio chip */}
        <div style={{ margin: "0 12px 12px", padding: "10px 12px", background: C.accentLight, borderRadius: 10, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>🧘</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{studioName}</div>
            <div style={{ fontSize: 10, color: C.textSoft }}>Plan Pro</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1 }}>
          {NAV.map(item => {
            const isActive = active === item.key
            return (
              <Link key={item.key} href={item.href}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", background: isActive ? C.accentLight : "none", color: isActive ? C.accent : C.textMid, fontSize: 13, fontWeight: isActive ? 700 : 500, borderLeft: `3px solid ${isActive ? C.accent : "transparent"}`, textDecoration: "none", transition: "all .15s" }}>
                <span style={{ fontSize: 15, width: 20, textAlign: "center" }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div style={{ padding: "12px 18px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.accent, flexShrink: 0 }}>
            {userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</div>
          </div>
          <button onClick={signOut} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.textMuted, padding: "2px 6px" }} title="Déconnexion">↩</button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, paddingBottom: 60 }} className="md:pb-0">
        {/* Topbar */}
        <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 16px", height: 50, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, position: "sticky", top: 0, zIndex: 50 }}
          className="md:px-7 md:h-14">
          <div style={{ fontSize: 17, fontWeight: 700, color: C.text, letterSpacing: -0.3 }} className="md:text-lg">
            <span className="md:hidden">Zen<span style={{ color: C.accent }}>Class</span></span>
            <span className="hidden md:inline">{NAV.find(n => active === n.key)?.label}</span>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span className="hidden md:inline" style={{ fontSize: 11, color: C.textSoft, padding: "4px 10px", background: C.bg, borderRadius: 20, border: `1px solid ${C.border}` }}>{studioName}</span>
            <span style={{ fontSize: 11, color: C.accent, padding: "4px 10px", background: C.accentBg, borderRadius: 20, border: "1px solid #DFC0A0", fontWeight: 600 }}>zenclass.fr</span>
          </div>
        </div>

        {/* Mobile page title */}
        <div className="md:hidden" style={{ padding: "14px 16px 0", fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: -0.5 }}>
          {NAV.find(n => active === n.key)?.label}
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {children}
        </div>
      </div>

      {/* ── BOTTOM NAV (mobile) ── */}
      <nav className="md:hidden" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 200, height: 60, boxShadow: "0 -2px 12px rgba(42,31,20,.06)" }}>
        {MOBILE_NAV.map(item => {
          const isActive = active === item.key
          return (
            <Link key={item.key} href={item.href}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, color: isActive ? C.accent : C.textMuted, fontSize: 10, fontWeight: isActive ? 700 : 400, textDecoration: "none", position: "relative", padding: "6px 0 4px" }}>
              {isActive && <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 20, height: 2, background: C.accent, borderRadius: "0 0 2px 2px" }} />}
              <span style={{ fontSize: 19 }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
