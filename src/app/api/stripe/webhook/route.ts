import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

const L = {
  ok:   (msg: string, data?: any) => console.log(`[STRIPE-WH] ✅ ${msg}`, data !== undefined ? JSON.stringify(data) : ""),
  err:  (msg: string, data?: any) => console.error(`[STRIPE-WH] ❌ ${msg}`, data !== undefined ? JSON.stringify(data) : ""),
  info: (msg: string, data?: any) => console.log(`[STRIPE-WH] ℹ️  ${msg}`, data !== undefined ? JSON.stringify(data) : ""),
  warn: (msg: string, data?: any) => console.warn(`[STRIPE-WH] ⚠️  ${msg}`, data !== undefined ? JSON.stringify(data) : ""),
}

async function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function updateStudioBilling(studioId: string, patch: Record<string, any>) {
  const db = await getAdmin()
  const { error } = await db.from("studios").update(patch).eq("id", studioId)
  if (error) L.err(`updateStudioBilling ${studioId}`, error)
  else L.ok(`Studio ${studioId} billing mis à jour`, patch)
}

async function getStudioBySubscription(subId: string) {
  const db = await getAdmin()
  const { data } = await db.from("studios")
    .select("id, billing_status, plan_slug").eq("stripe_subscription_id", subId).single()
  if (!data) L.warn(`Aucun studio trouvé pour stripe_subscription_id ${subId}`)
  return data
}

export async function POST(req: NextRequest) {
  const body   = await req.text()
  const sig    = req.headers.get("stripe-signature")
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig)    { L.err("Header stripe-signature absent"); return NextResponse.json({ error: "No signature" }, { status: 400 }) }
  if (!secret) { L.err("STRIPE_WEBHOOK_SECRET non configuré"); return NextResponse.json({ error: "No webhook secret" }, { status: 500 }) }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
    L.ok(`Signature vérifiée — event: ${event.type}`)
  } catch (err: any) {
    L.err(`Échec vérification signature — ${err.message}`)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const getStudioId = (obj: any): string | null => obj?.metadata?.studioId || null

  try {
    switch (event.type) {

      // ── Checkout complété ────────────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const studioId = getStudioId(session)
        L.info("checkout.session.completed", { studioId, mode: session.mode, amount: session.amount_total, metadata: session.metadata })
        if (!studioId) { L.warn("studioId absent — ignoré"); break }

        // SMS one-shot
        if (session.mode === "payment") {
          const { packId, credits } = session.metadata || {}
          L.info(`mode=payment — packId: ${packId}, credits: ${credits}`)
          if (packId && credits) {
            const db = await getAdmin()
            const creditsToAdd = parseInt(credits)
            const { data: st } = await db.from("studios").select("sms_credits_balance").eq("id", studioId).single()
            const newBalance = (st?.sms_credits_balance || 0) + creditsToAdd
            const { error: uErr } = await db.from("studios").update({ sms_credits_balance: newBalance }).eq("id", studioId)
            if (uErr) L.err("Échec update sms_credits_balance", uErr)
            else L.ok(`SMS crédits studio ${studioId}: +${creditsToAdd} → ${newBalance}`)
            const { error: iErr } = await db.from("sms_credit_purchases").insert({
              studio_id: studioId, credits: creditsToAdd,
              amount_cents: session.amount_total || 0,
              stripe_payment_id: session.payment_intent as string,
            })
            if (iErr) L.err("Échec insert sms_credit_purchases", iErr)
            else L.ok("sms_credit_purchases inséré")
          }
          break
        }

        // Abonnement Fydelys
        const subId   = session.subscription as string
        const planSlug = session.metadata?.planSlug || "essentiel"
        L.info(`mode=subscription — subId: ${subId}, planSlug: ${planSlug}`)
        await updateStudioBilling(studioId, {
          billing_status: "active", stripe_subscription_id: subId,
          plan_slug: planSlug, plan_started_at: new Date().toISOString(),
        })
        break
      }

      // ── Abonnement mis à jour ────────────────────────────────────────────
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription
        const studioId = getStudioId(sub)
        L.info("customer.subscription.updated", { studioId, status: sub.status, planSlug: sub.metadata?.planSlug })
        if (!studioId) { L.warn("studioId absent — ignoré"); break }
        const statusMap: Record<string, string> = {
          active: "active", trialing: "trialing", past_due: "past_due",
          canceled: "canceled", unpaid: "suspended", paused: "suspended",
        }
        await updateStudioBilling(studioId, {
          billing_status: statusMap[sub.status] || "suspended",
          plan_slug: sub.metadata?.planSlug || "essentiel",
          stripe_subscription_id: sub.id,
        })
        break
      }

      // ── Abonnement annulé ────────────────────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription
        const studioId = getStudioId(sub)
        L.info("customer.subscription.deleted", { studioId, subId: sub.id })
        if (!studioId) { L.warn("studioId absent — ignoré"); break }
        await updateStudioBilling(studioId, { billing_status: "canceled", stripe_subscription_id: null })
        break
      }

      // ── Paiement facture échoué ──────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const subId = invoice.subscription as string
        L.info("invoice.payment_failed", { subId })
        if (!subId) { L.warn("subscription absent — ignoré"); break }
        const studio = await getStudioBySubscription(subId)
        if (studio) await updateStudioBilling(studio.id, { billing_status: "past_due" })
        break
      }

      // ── Paiement facture réussi : récupération past_due + rollover SMS ───
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        const subId = invoice.subscription as string
        L.info("invoice.payment_succeeded", { subId, amount: invoice.amount_paid })
        if (!subId) { L.warn("subscription absent — ignoré"); break }

        const studio = await getStudioBySubscription(subId)
        if (!studio) break

        // 1) Récupération past_due
        if (studio.billing_status === "past_due") {
          await updateStudioBilling(studio.id, { billing_status: "active" })
        }

        // 2) Rollover SMS
        const SMS_BY_PLAN: Record<string, number> = { essentiel: 0, standard: 50, pro: 100 }
        const included = SMS_BY_PLAN[(studio as any).plan_slug] || 0
        L.info(`Rollover SMS — plan: ${(studio as any).plan_slug}, crédits inclus: ${included}`)
        if (included > 0) {
          const db = await getAdmin()
          const nextReset = new Date()
          nextReset.setMonth(nextReset.getMonth() + 1)
          const { data: currentSt } = await db.from("studios").select("sms_credits_balance").eq("id", studio.id).single()
          const newBalance = (currentSt?.sms_credits_balance || 0) + included
          const { error } = await db.from("studios").update({
            sms_credits_included: included,
            sms_credits_balance: newBalance,
            sms_credits_reset_at: nextReset.toISOString().slice(0, 10),
          }).eq("id", studio.id)
          if (error) L.err("Échec rollover SMS", error)
          else L.ok(`Rollover SMS studio ${studio.id}: +${included} → ${newBalance}`)
        }
        break
      }

      default:
        L.info(`Event non géré: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    L.err(`Exception non gérée — ${err.message}`, err.stack?.slice(0, 300))
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
