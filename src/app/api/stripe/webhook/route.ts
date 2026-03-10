import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

// Supabase admin client (service role) pour le webhook — pas de cookie d'user
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function updateStudioBilling(studioId: string, patch: Record<string, any>) {
  const { error } = await supabaseAdmin.from("studios").update(patch).eq("id", studioId)
  if (error) console.error("Supabase update error:", error)
}

export async function POST(req: NextRequest) {
  const body    = await req.text()
  const sig     = req.headers.get("stripe-signature")!
  const secret  = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch (err: any) {
    console.error("Webhook signature error:", err.message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const getStudioId = (obj: any): string | null =>
    obj?.metadata?.studioId || null

  try {
    switch (event.type) {

      // ── Paiement réussi → activer ────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const studioId = getStudioId(session)
        if (!studioId) break
        const subId   = session.subscription as string
        const planSlug = session.metadata?.planSlug || "essentiel"
        await updateStudioBilling(studioId, {
          billing_status:         "active",
          stripe_subscription_id: subId,
          plan_slug:              planSlug,
          plan_started_at:        new Date().toISOString(),
        })
        break
      }

      // ── Abonnement actif / mis à jour ────────────────────────────────────
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription
        const studioId = getStudioId(sub)
        if (!studioId) break

        const planSlug = sub.metadata?.planSlug || "essentiel"
        const statusMap: Record<string, string> = {
          active:   "active",
          trialing: "trialing",
          past_due: "past_due",
          canceled: "canceled",
          unpaid:   "suspended",
          paused:   "suspended",
        }
        const billing_status = statusMap[sub.status] || "suspended"
        await updateStudioBilling(studioId, {
          billing_status,
          plan_slug: planSlug,
          stripe_subscription_id: sub.id,
        })
        break
      }

      // ── Abonnement annulé ────────────────────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription
        const studioId = getStudioId(sub)
        if (!studioId) break
        await updateStudioBilling(studioId, {
          billing_status: "canceled",
          stripe_subscription_id: null,
        })
        break
      }

      // ── Paiement échoué → past_due ───────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const subId   = invoice.subscription as string
        if (!subId) break
        const { data: studio } = await supabaseAdmin
          .from("studios").select("id").eq("stripe_subscription_id", subId).single()
        if (studio) {
          await updateStudioBilling(studio.id, { billing_status: "past_due" })
        }
        break
      }

      // ── Paiement récupéré après échec ────────────────────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        const subId   = invoice.subscription as string
        if (!subId) break
        const { data: studio } = await supabaseAdmin
          .from("studios").select("id, billing_status").eq("stripe_subscription_id", subId).single()
        if (studio && studio.billing_status === "past_due") {
          await updateStudioBilling(studio.id, { billing_status: "active" })
        }
        break
      }

      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error("Webhook handler error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
