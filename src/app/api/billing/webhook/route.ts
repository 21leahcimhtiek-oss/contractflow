import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createServiceClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook error: ${err instanceof Error ? err.message : "Unknown"}` },
      { status: 400 }
    );
  }

  const supabase = await createServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.CheckoutSession;
      const orgId = session.metadata?.org_id;
      const planId = session.metadata?.plan_id;
      const customerId =
        typeof session.customer === "string" ? session.customer : session.customer?.id || null;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id || null;

      if (orgId && planId && customerId) {
        await supabase
          .from("orgs")
          .update({
            plan: planId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
          })
          .eq("id", orgId);
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const orgId = subscription.metadata?.org_id;
      const planId = subscription.metadata?.plan_id;

      if (orgId) {
        await supabase
          .from("orgs")
          .update({
            plan: planId || "starter",
            stripe_subscription_id: subscription.id,
          })
          .eq("id", orgId);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const orgId = subscription.metadata?.org_id;

      if (orgId) {
        await supabase
          .from("orgs")
          .update({ plan: "starter", stripe_subscription_id: null })
          .eq("id", orgId);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id || null;

      if (customerId) {
        const { data: org } = await supabase
          .from("orgs")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (org) {
          await supabase.from("audit_trail").insert({
            org_id: org.id,
            action: "billing.payment_failed",
            details: {
              invoice_id: invoice.id,
              customer_id: customerId,
              amount_due: invoice.amount_due,
              amount_paid: invoice.amount_paid,
              currency: invoice.currency,
              billing_reason: invoice.billing_reason,
            },
          });
        }
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id || null;

      if (customerId) {
        const { data: org } = await supabase
          .from("orgs")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (org) {
          await supabase.from("audit_trail").insert({
            org_id: org.id,
            action: "billing.payment_succeeded",
            details: {
              invoice_id: invoice.id,
              customer_id: customerId,
              amount_due: invoice.amount_due,
              amount_paid: invoice.amount_paid,
              currency: invoice.currency,
              billing_reason: invoice.billing_reason,
            },
          });
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
