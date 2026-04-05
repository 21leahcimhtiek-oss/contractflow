import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createServiceClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
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

      if (orgId && planId && session.customer) {
        await supabase
          .from("orgs")
          .update({
            plan: planId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
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
      // TODO: Send payment failure email notification
      break;
    }
  }

  return NextResponse.json({ received: true });
}