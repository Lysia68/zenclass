import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerSupabase as createClient } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { planSlug, studioId } = await req.json()

    // Vérifier admin du studio
    const { data: profile } = await supabase
      .from("profiles").select("role, studio_id").eq("id", user.id).single()
    if (!profile || profile.role !== "admin" || profile.studio_id !== studioId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Récupérer plan + studio
    const { data: plan } = await supabase
      .from("plans").select("stripe_price_id, name").eq("slug", planSlug).single()
    if (!plan?.stripe_price_id) {
      return NextResponse.json({ error: "Plan non configuré" }, { status: 404 })
    }

    const { data: studio } = await supabase
      .from("studios").select("name, stripe_customer_id, billing_status, trial_ends_at")
      .eq("id", studioId).single()
    if (!studio) return NextResponse.json({ error: "Studio introuvable" }, { status: 404 })

    // Créer ou récupérer le customer Stripe
    let customerId = studio.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: studio.name,
        metadata: { studioId, userId: user.id },
      })
      customerId = customer.id
      await supabase.from("studios").update({ stripe_customer_id: customerId }).eq("id", studioId)
    }

    // Calcul trial restant
    const trialEnd = studio.billing_status === "trialing" && studio.trial_ends_at
      ? Math.floor(new Date(studio.trial_ends_at).getTime() / 1000)
      : undefined
    const hasTrialLeft = trialEnd && trialEnd > Math.floor(Date.now() / 1000)

    // Créer la subscription avec payment_behavior = default_incomplete
    // → génère un PaymentIntent qu'on confirme via Elements
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: plan.stripe_price_id }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
      ...(hasTrialLeft ? { trial_end: trialEnd } : {}),
      metadata: { studioId, planSlug },
    })

    const invoice = subscription.latest_invoice as Stripe.Invoice
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent

    // Si trial → pas de paiement immédiat, on a un SetupIntent à la place
    let clientSecret: string | null = null
    let type: "payment" | "setup" = "payment"

    if (hasTrialLeft) {
      // Créer un SetupIntent pour enregistrer la carte sans débit immédiat
      const setup = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ["card"],
        metadata: { studioId, planSlug, subscriptionId: subscription.id },
      })
      clientSecret = setup.client_secret
      type = "setup"
    } else {
      clientSecret = paymentIntent?.client_secret ?? null
      type = "payment"
    }

    // Sauvegarder l'id subscription en pending
    await supabase.from("studios").update({
      stripe_subscription_id: subscription.id,
      plan_slug: planSlug,
    }).eq("id", studioId)

    return NextResponse.json({ clientSecret, type, subscriptionId: subscription.id })
  } catch (err: any) {
    console.error("Subscribe error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
