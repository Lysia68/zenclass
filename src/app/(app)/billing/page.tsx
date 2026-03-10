"use client"
export const dynamic = "force-dynamic"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter, useSearchParams } from "next/navigation"

const C = {
  bg:"#F4EFE8", surface:"#FFFFFF", border:"#DDD5C8", borderSoft:"#EAE4DA",
  text:"#2A1F14", textMid:"#5C4A38", textSoft:"#8C7B6C", textMuted:"#B0A090",
  accent:"#A06838", accentDark:"#8C5E38", accentBg:"#F5EBE0",
  ok:"#4E8A58", okBg:"#E6F2E8", warn:"#A85030", warnBg:"#F5EAE6",
  gold:"#C4922A", goldBg:"#FDF4E3",
}

const PLANS = [
  {
    slug: "essentiel",
    name: "Essentiel",
    price: 9,
    desc: "Pour débuter",
    features: ["Jusqu'à 50 adhérents", "2 coachs", "Planning", "Paiements"],
    color: C.accent,
    bg: C.accentBg,
  },
  {
    slug: "standard",
    name: "Standard",
    price: 29,
    desc: "Pour les studios actifs",
    features: ["Jusqu'à 200 adhérents", "5 coachs", "Planning", "Paiements", "Disciplines", "Statistiques"],
    color: C.gold,
    bg: C.goldBg,
    popular: true,
  },
  {
    slug: "pro",
    name: "Pro",
    price: 69,
    desc: "Pour les grands studios",
    features: ["Adhérents illimités", "Coachs illimités", "Tout Standard +", "API", "Support prioritaire"],
    color: C.ok,
    bg: C.okBg,
  },
]

type Studio = {
  id: string
  name: string
  billing_status: string
  trial_ends_at: string | null
  plan_slug: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}

export default function BillingPage() {
  const supabase    = createClient()
  const router      = useRouter()
  const params      = useSearchParams()
  const [studio, setStudio]     = useState<Studio | null>(null)
  const [loading, setLoading]   = useState(true)
  const [busy, setBusy]         = useState<string | null>(null)
  const [toast, setToast]       = useState<{msg:string;ok:boolean}|null>(null)

  const showToast = (msg:string, ok=true) => {
    setToast({msg,ok})
    setTimeout(()=>setToast(null), 4000)
  }

  useEffect(() => {
    if (params.get("success") === "1") showToast("🎉 Abonnement activé avec succès !")
    if (params.get("canceled") === "1") showToast("Paiement annulé.", false)
  }, [params])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/"); return }

      const { data: profile } = await supabase
        .from("profiles").select("studio_id, role").eq("id", user.id).single()
      if (!profile || profile.role !== "admin") { router.push("/dashboard"); return }

      const { data: st } = await supabase
        .from("studios")
        .select("id,name,billing_status,trial_ends_at,plan_slug,stripe_customer_id,stripe_subscription_id")
        .eq("id", profile.studio_id)
        .single()

      setStudio(st)
      setLoading(false)
    }
    load()
  }, [])

  const trialDaysLeft = studio?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(studio.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 0

  const isTrialing  = studio?.billing_status === "trialing"
  const isActive    = studio?.billing_status === "active"
  const isPastDue   = studio?.billing_status === "past_due"
  const isCanceled  = studio?.billing_status === "canceled"
  const isSuspended = studio?.billing_status === "suspended"
  const isBlocked   = isPastDue || isCanceled || isSuspended

  async function checkout(planSlug: string) {
    if (!studio) return
    setBusy(planSlug)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug, studioId: studio.id }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else showToast(data.error || "Erreur", false)
    } catch { showToast("Erreur réseau", false) }
    setBusy(null)
  }

  async function openPortal() {
    if (!studio) return
    setBusy("portal")
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studioId: studio.id }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else showToast(data.error || "Erreur", false)
    } catch { showToast("Erreur réseau", false) }
    setBusy(null)
  }

  const inp = {
    padding:"11px 14px", border:`1.5px solid ${C.border}`,
    borderRadius:10, fontSize:14, color:C.text, background:"#FDFAF7",
    width:"100%", boxSizing:"border-box" as const, outline:"none",
  }

  if (loading) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{fontSize:14,color:C.textSoft}}>Chargement…</div>
    </div>
  )

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Inter',-apple-system,sans-serif"}}>

      {/* Toast */}
      {toast && (
        <div style={{position:"fixed",top:20,right:20,zIndex:999,padding:"12px 20px",background:toast.ok?C.ok:C.warn,borderRadius:10,color:"#fff",fontSize:14,fontWeight:600,boxShadow:"0 8px 24px rgba(0,0,0,.15)"}}>
          {toast.msg}
        </div>
      )}

      <div style={{maxWidth:860,margin:"0 auto",padding:"40px 24px"}}>

        {/* Header */}
        <div style={{marginBottom:32}}>
          <h1 style={{fontSize:26,fontWeight:800,color:C.text,margin:0,letterSpacing:-0.5}}>Abonnement</h1>
          <p style={{fontSize:14,color:C.textSoft,margin:"6px 0 0"}}>Gérez votre formule et vos moyens de paiement</p>
        </div>

        {/* Bannière statut */}
        {isTrialing && (
          <div style={{padding:"16px 20px",background:trialDaysLeft<=3?C.warnBg:C.goldBg,border:`1px solid ${trialDaysLeft<=3?"#F5C2B5":"rgba(196,146,42,.25)"}`,borderRadius:14,marginBottom:28,display:"flex",alignItems:"center",gap:14}}>
            <div style={{fontSize:28}}>⏳</div>
            <div>
              <div style={{fontSize:15,fontWeight:700,color:trialDaysLeft<=3?C.warn:C.gold}}>
                {trialDaysLeft > 0 ? `${trialDaysLeft} jour${trialDaysLeft>1?"s":""} d'essai restant${trialDaysLeft>1?"s":""}` : "Période d'essai expirée"}
              </div>
              <div style={{fontSize:13,color:C.textMid,marginTop:2}}>
                {trialDaysLeft > 0
                  ? "Choisissez une formule maintenant pour continuer sans interruption."
                  : "Votre accès est limité. Choisissez une formule pour réactiver votre studio."}
              </div>
            </div>
          </div>
        )}

        {isActive && (
          <div style={{padding:"14px 20px",background:C.okBg,border:"1px solid rgba(78,138,88,.2)",borderRadius:14,marginBottom:28,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{fontSize:20}}>✅</div>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:C.ok}}>Abonnement actif — {PLANS.find(p=>p.slug===studio?.plan_slug)?.name || studio?.plan_slug}</div>
                <div style={{fontSize:12,color:C.textSoft,marginTop:1}}>Renouvellement automatique chaque mois</div>
              </div>
            </div>
            <button onClick={openPortal} disabled={busy==="portal"}
              style={{padding:"8px 16px",background:"transparent",border:`1.5px solid ${C.ok}`,borderRadius:8,color:C.ok,fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
              {busy==="portal" ? "…" : "Gérer / Annuler"}
            </button>
          </div>
        )}

        {isBlocked && (
          <div style={{padding:"16px 20px",background:C.warnBg,border:"1px solid #F5C2B5",borderRadius:14,marginBottom:28}}>
            <div style={{fontSize:15,fontWeight:700,color:C.warn,marginBottom:4}}>
              {isPastDue ? "⚠️ Paiement en échec" : "🚫 Accès suspendu"}
            </div>
            <div style={{fontSize:13,color:C.textMid}}>
              {isPastDue
                ? "Votre dernier paiement a échoué. Mettez à jour votre carte pour réactiver votre studio."
                : "Votre studio est suspendu. Souscrivez un abonnement pour le réactiver."}
            </div>
            {studio?.stripe_customer_id && (
              <button onClick={openPortal} style={{marginTop:12,padding:"8px 18px",background:C.warn,border:"none",borderRadius:8,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                Mettre à jour le paiement
              </button>
            )}
          </div>
        )}

        {/* Plans */}
        <h2 style={{fontSize:17,fontWeight:700,color:C.text,marginBottom:16}}>
          {isActive ? "Changer de formule" : "Choisir une formule"}
        </h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:16,marginBottom:40}}>
          {PLANS.map(plan => {
            const isCurrent = studio?.plan_slug === plan.slug && isActive
            const isBusy    = busy === plan.slug
            return (
              <div key={plan.slug} style={{
                background: C.surface,
                border: `${isCurrent?"2.5px":"1.5px"} solid ${isCurrent?plan.color:C.border}`,
                borderRadius:16, padding:"24px 20px", position:"relative",
                boxShadow: isCurrent ? `0 4px 20px ${plan.color}22` : "none",
              }}>
                {plan.popular && !isCurrent && (
                  <div style={{position:"absolute",top:-11,left:"50%",transform:"translateX(-50%)",background:plan.color,color:"#fff",fontSize:11,fontWeight:700,padding:"3px 12px",borderRadius:12,whiteSpace:"nowrap"}}>
                    ⭐ Populaire
                  </div>
                )}
                {isCurrent && (
                  <div style={{position:"absolute",top:-11,left:"50%",transform:"translateX(-50%)",background:plan.color,color:"#fff",fontSize:11,fontWeight:700,padding:"3px 12px",borderRadius:12,whiteSpace:"nowrap"}}>
                    ✓ Formule actuelle
                  </div>
                )}
                <div style={{fontSize:13,fontWeight:700,color:plan.color,marginBottom:4}}>{plan.name}</div>
                <div style={{fontSize:28,fontWeight:800,color:C.text,letterSpacing:-1,lineHeight:1}}>
                  {plan.price}€<span style={{fontSize:13,fontWeight:500,color:C.textSoft}}>/mois</span>
                </div>
                <div style={{fontSize:12,color:C.textSoft,marginTop:4,marginBottom:16}}>{plan.desc}</div>
                <ul style={{listStyle:"none",padding:0,margin:"0 0 20px",display:"flex",flexDirection:"column",gap:6}}>
                  {plan.features.map(f=>(
                    <li key={f} style={{fontSize:12,color:C.textMid,display:"flex",gap:6,alignItems:"flex-start"}}>
                      <span style={{color:plan.color,flexShrink:0}}>✓</span>{f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => checkout(plan.slug)}
                  disabled={isCurrent || isBusy}
                  style={{
                    width:"100%", padding:"10px", borderRadius:9, fontSize:13, fontWeight:700, cursor:isCurrent?"default":"pointer",
                    background: isCurrent ? plan.bg : `linear-gradient(145deg,${plan.color},${plan.color}cc)`,
                    color: isCurrent ? plan.color : "#fff",
                    border: isCurrent ? `1.5px solid ${plan.color}44` : "none",
                    opacity: isBusy ? 0.7 : 1,
                  }}>
                  {isBusy ? "Redirection…" : isCurrent ? "Actif" : isActive ? "Passer à ce plan" : isTrialing ? "Choisir cette formule" : "Souscrire"}
                </button>
              </div>
            )
          })}
        </div>

        {/* Footer info */}
        <div style={{padding:"16px 20px",background:C.surface,border:`1px solid ${C.borderSoft}`,borderRadius:12,fontSize:12,color:C.textSoft,lineHeight:1.7}}>
          <div style={{fontWeight:700,color:C.textMid,marginBottom:4}}>ℹ️ Informations de facturation</div>
          Paiement sécurisé par Stripe. Vous pouvez annuler à tout moment via le portail de facturation.
          Aucun remboursement pour le mois en cours. En cas de changement de plan, la différence est calculée au prorata.
          Les 15 premiers jours sont offerts sans engagement ni carte bancaire.
        </div>

      </div>
    </div>
  )
}
