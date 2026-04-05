import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, PLANS } from "@/lib/stripe/client";
import { z } from "zod";

const checkoutSchema = z.object({
  plan_id: z.enum(["starter", "pro", "enterprise"]),
  org_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { data: membership } = await supabase
    .from("org_members")
    .select("role, orgs(stripe_customer_id)")
    .eq("user_id", user.id)
    .eq("org_id", parsed.data.org_id)
    .single();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const plan = PLANS.find((p) => p.id === parsed.data.plan_id);
  if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const org = membership.orgs as { stripe_customer_id: string | null } | null;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer: org?.stripe_customer_id || undefined,
    customer_email: !org?.stripe_customer_id ? user.email : undefined,
    line_items: [{ price: plan.priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
    metadata: {
      org_id: parsed.data.org_id,
      user_id: user.id,
      plan_id: parsed.data.plan_id,
    },
    subscription_data: {
      metadata: {
        org_id: parsed.data.org_id,
        plan_id: parsed.data.plan_id,
      },
    },
    allow_promotion_codes: true,
    trial_period_days: 14,
  });

  return NextResponse.json({ url: session.url });
}